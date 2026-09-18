<b>For personal gaming currently.</b> Added widgets:
1. [Price track](#price-track-widget)
2. [Campaign guide](#campaign-guide-widget)
3. [Expedition Rune](#expedition-rune-widget)
4. [Url list](#url-list-widget)

[Build step](#build-step)

## Price Track Widget
A price track widget to show pricing. Data from poeninja, toggle exchange rate, search item, filter group, pinned item and spark chart.
| Top                                                               | Pinned                                                               |
|-----------------------------------------------------------------------|-----------------------------------------------------------------------|
| ![Price Track Top](./renderer/public/images/priceTrack-top.png) | ![Price Track Pin](./renderer/public/images/priceTrack-pin.png) |

## Campaign Guide Widget
Customisable campaign guide, default instructions only for zh-Hans + en.
| Setting                                                               | Display                                                               |
|-----------------------------------------------------------------------|-----------------------------------------------------------------------|
| ![Campaign Guide Setting](./renderer/public/images/campaignGuide-setting.png) | ![Campaign Guide Result](./renderer/public/images/campaignGuide-result.png)|

## Expedition Rune Widget
Its modified from Endre's [fork](https://github.com/Endre-Tonnessen/Exiled-Exchange-2-Expedition-Checker) project, thanks to his implementation on Windows's OCR. Support zh-Hans translation in expedition widget.

1. mac port of OCR, using macOS native engine, currently set to ocr zh-Hans,en-US at the same time
2. modified win port of OCR to support zh-Hans, limitation on Windows OCR: only one language per call, no mixed zh+en pass, so the lang is pass from app language config

| Mac & Win                                                            | 
|------------------------------------------------------------------|
| ![Ocr Port](./renderer/public/images/expedition-rune.png) |

## Url List Widget
A url widget shortcut to access resources.

| Setting                                                          | Display                                                            |
|------------------------------------------------------------------|--------------------------------------------------------------------|
| ![Price Track Search](./renderer/public/images/urlList-edit.png) | ![Price Track Result](./renderer/public/images/urlList-result.png) |

## Build Step
### Mac Build
1. to build dmg `sh testUpdate.sh`
2. grant accessibility + screen recording
    - remove the permission entries
    - re-sign `codesign --force --deep --sign - /Applications/Exiled\ Exchange\ 2.app`
    - kill the app and grant both
    - restart the app

### Win Build
1. install extra language OCR
    - open powershell with admin rights
    - `Add-WindowsCapability -Online -Name "Language.OCR~~~zh-TW~0.0.1.0"` and restart
    - configure ExiledExchange2 language, support zh-Hans,en-US mapping
2. to build exe
    - run build instruction from [DEVELOPING.md](./DEVELOPING.md#how-to-build)
    - open powershell with admin rights
    - cd to main/
    - `npx electron-builder --win --x64`

# ![Perfect Jewelers Orb](./renderer/public/images/jeweler.png) Exiled Exchange 2

[![GitHub Downloads (specific asset, latest release)](https://img.shields.io/github/downloads/kvan7/exiled-exchange-2/latest/Exiled-Exchange-2-Setup-0.16.3.exe?style=plastic&link=https%3A%2F%2Ftooomm.github.io%2Fgithub-release-stats%2F%3Fusername%3Dkvan7%26repository%3DExiled-Exchange-2)](https://tooomm.github.io/github-release-stats/?username=kvan7&repository=Exiled-Exchange-2)
[![GitHub Tag](https://img.shields.io/github/v/tag/kvan7/exiled-exchange-2?style=plastic&label=latest%20version)](https://github.com/Kvan7/Exiled-Exchange-2/releases/latest)
[![GitHub commits since latest release (branch)](https://img.shields.io/github/commits-since/kvan7/exiled-exchange-2/latest/dev?style=plastic)](https://github.com/Kvan7/Exiled-Exchange-2/commits/dev/)
[![Translation status](https://translate.codeberg.org/widget/exiled-exchange-2/svg-badge.svg)](https://translate.codeberg.org/engage/exiled-exchange-2/)

Path of Exile 2 overlay program for price checking items, among many other loved features.

Fork of [Awakened PoE Trade](https://github.com/SnosMe/awakened-poe-trade).

The ONLY official download sites are <https://kvan7.github.io/Exiled-Exchange-2/download> or <https://github.com/Kvan7/Exiled-Exchange-2/releases>, any other locations are not official and may be malicious.

## Moving from POE1/Awakened PoE Trade

1. Download latest release from [releases](https://github.com/Kvan7/exiled-exchange-2/releases)
2. Run installer
3. Run Exiled Exchange 2
4. Launch PoE2 to generate correct files
5. Quit PoE2 and EE2 after seeing the banner popup that EE2 loaded
6. Copy `apt-data` from `%APPDATA%\awakened-poe-trade` to `%APPDATA%\exiled-exchange-2` to copy your previous settings
  - Resulting directory structure should look like this:
  - `%APPDATA%\exiled-exchange-2\apt-data\`
    - `config.json`
7. Edit `config.json` and change the value of "windowTitle": "Path of Exile" to instead be "Path of Exile 2", otherwise it will open only for poe1
8. Start Exiled Exchange 2 and PoE2

## FAQ

<https://kvan7.github.io/Exiled-Exchange-2/faq>

## Tool showcase

| Gem                                                | Rare                                                 | Unique                                                   | Currency                                                     |
| -------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| ![Gem Check](./docs/reference-images/GemCheck.png) | ![Rare Check](./docs/reference-images/RareCheck.png) | ![Unique Check](./docs/reference-images/UniqueCheck.png) | ![Currency Check](./docs/reference-images/CurrencyCheck.png) |

### Development

See [DEVELOPING.md](./DEVELOPING.md)

### Acknowledgments

- [awakened-poe-trade](https://github.com/SnosMe/awakened-poe-trade)
- [libuiohook](https://github.com/kwhat/libuiohook)
- [RePoE](https://github.com/brather1ng/RePoE)
- [poeprices.info](https://www.poeprices.info/)
- [poe.ninja](https://poe.ninja/)

![graph](https://i.imgur.com/MATqhv7.png)
