export interface ExpeditionCaptureRegion {
  /** all fields are fractions (0..1) of the game window, not pixels - see cropImageFraction */
  x: number;
  y: number;
  width: number;
  height: number;
}

// A real, user-calibrated starting point (Runeshape Combinations text column) for a
// freshly-added widget instance - better than an arbitrary guess.
export const DEFAULT_REGION: ExpeditionCaptureRegion = {
  x: 0.09620456466610314,
  y: 0.1410775427995972,
  width: 0.11548605240912935,
  height: 0.4892547834843907,
};
