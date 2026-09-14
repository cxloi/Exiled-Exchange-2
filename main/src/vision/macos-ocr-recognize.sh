#!/bin/bash
# Bridges to macOS' own OCR engine (Vision / VNRecognizeTextRequest - the same engine
# behind Live Text and Preview's text selection). There is no Node/Electron API for
# this; MacOcr.ts spawns this script per call as the only way to reach it. Vision is
# reached through JXA's Objective-C bridge (osascript -l JavaScript), which needs no
# toolchain and no build step - only macOS 10.15+.
#
# Usage: ./recognize.sh <image path>    [env OCR_LANGUAGES=zh-Hans,en-US]
# Prints one JSON object to stdout: {ok, text, lines[{text, words[{text,x,y,width,height}]}],
# elapsedMs, engineLanguage, imageWidth, imageHeight} on success, or {ok:false, error} on failure.

set -u

if [ $# -ne 1 ]; then
    printf '{"ok":false,"error":"Usage: recognize.sh <image path>"}\n'
    exit 1
fi

# Vision is given a file URL, so a relative path has to be resolved here - the
# osascript subprocess does not inherit this shell's working directory reliably.
case "$1" in
    /*) OCR_IMAGE="$1" ;;
    *)  OCR_IMAGE="$PWD/$1" ;;
esac

if [ ! -f "$OCR_IMAGE" ]; then
    printf '{"ok":false,"error":"No file at %s"}\n' "$OCR_IMAGE"
    exit 1
fi

export OCR_IMAGE
export OCR_LANGUAGES="${OCR_LANGUAGES:-}"

exec osascript -l JavaScript - <<'JXA'
ObjC.import('Vision');
ObjC.import('AppKit');
ObjC.import('stdlib');

var env = $.NSProcessInfo.processInfo.environment;
function getenv(name) {
    var v = env.objectForKey(name);
    return v.isNil() ? '' : ObjC.unwrap(v);
}

// console.log goes to stderr under osascript, and returning from run() would not
// let us set an exit code - so write stdout by hand.
function emit(obj, code) {
    var data = $.NSString.alloc.initWithUTF8String(JSON.stringify(obj) + '\n')
        .dataUsingEncoding($.NSUTF8StringEncoding);
    $.NSFileHandle.fileHandleWithStandardOutput.writeData(data);
    $.exit(code);
}
function fail(message) { emit({ ok: false, error: String(message) }, 1); }

var path = getenv('OCR_IMAGE');

// NSImage reports points, not pixels - a screenshot with a 2x DPI tag would give
// half-size numbers - so read the true pixel dimensions off the bitmap rep.
var rep = $.NSBitmapImageRep.imageRepWithContentsOfFile(path);
if (rep.isNil()) { fail('Could not decode an image at ' + path); }
var imageWidth = rep.pixelsWide;
var imageHeight = rep.pixelsHigh;

var request = $.VNRecognizeTextRequest.alloc.init;
request.recognitionLevel = 0;        // VNRequestTextRecognitionLevelAccurate
request.usesLanguageCorrection = true;

// Vision ships its languages with the OS, so unlike Windows there is no pack to
// install - but it will not guess a script you did not ask for, so let the caller
// pin languages when the capture is not English.
var languages = getenv('OCR_LANGUAGES');
if (languages) {
    request.recognitionLanguages = $(languages.split(',').map(function (s) { return s.trim(); }));
}

var handler = $.VNImageRequestHandler.alloc.initWithURLOptions(
    $.NSURL.fileURLWithPath(path), $({}));

var started = Date.now();
var err = Ref();
if (!handler.performRequestsError($([request]), err)) {
    var e = err[0];
    fail(e && !e.isNil() ? ObjC.unwrap(e.localizedDescription) : 'Vision request failed');
}
var elapsedMs = Date.now() - started;

// Vision returns normalized rects with a bottom-left origin; the Windows script's
// contract is pixels with a top-left origin, so flip Y and scale here rather than
// leaking the difference into callers.
function toPixels(box) {
    var round1 = function (v) { return Math.round(v * 10) / 10; };
    return {
        x: round1(box.origin.x * imageWidth),
        y: round1((1 - box.origin.y - box.size.height) * imageHeight),
        width: round1(box.size.width * imageWidth),
        height: round1(box.size.height * imageHeight)
    };
}

var lines = [];
var observations = ObjC.unwrap(request.results) || [];
for (var i = 0; i < observations.length; i++) {
    var observation = observations[i];
    var candidates = observation.topCandidates(1);
    if (candidates.count === 0) { continue; }
    var candidate = candidates.objectAtIndex(0);
    var text = ObjC.unwrap(candidate.string);

    // Vision has no word-level results - bounding boxes come from asking the
    // candidate for the box of a substring range, so walk runs of non-whitespace.
    // NSRange is UTF-16, which is what JS string offsets already are.
    var words = [];
    var re = /\S+/g, match;
    while ((match = re.exec(text)) !== null) {
        var boxErr = Ref();
        var rect = candidate.boundingBoxForRangeError(
            $.NSMakeRange(match.index, match[0].length), boxErr);
        // Rotated text yields a quad; its axis-aligned boundingBox is what
        // Windows' OcrWord.BoundingRect gives.
        var box = (rect && !rect.isNil()) ? rect.boundingBox : observation.boundingBox;
        var px = toPixels(box);
        words.push({ text: match[0], x: px.x, y: px.y, width: px.width, height: px.height });
    }
    lines.push({ text: text, words: words });
}

emit({
    ok: true,
    text: lines.map(function (l) { return l.text; }).join('\n'),
    lines: lines,
    elapsedMs: elapsedMs,
    engineLanguage: (ObjC.unwrap(request.recognitionLanguages) || ['automatic'])[0],
    imageWidth: imageWidth,
    imageHeight: imageHeight
}, 0);
JXA