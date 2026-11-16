# Colorixer: Advanced Color Palette Creator

Colorixer is a powerful color picker application that helps artists and designers create harmonious color palettes and export them to popular drawing applications.

## Features

- **Color wheel and HSV/HSL controls**: The wheel is the painter's RYB circle (red, yellow and blue primaries, after Gossett and Chen's pigment-mixing model), so complements are red and green, blue and orange, yellow and violet. Drag on it to pick hue and saturation, or set hue, saturation and value with sliders and numeric fields. The HSV/HSL switch above the sliders trades value for lightness, and the app remembers the choice
- **Color Harmony Generation**: Analogous, complementary, split complementary, triadic, square, compound, shades and monochromatic palettes of five colors, drawn on the wheel. Saved palettes keep the colors they were saved with
- **Palettes from images**: The image button next to Save asks for a photo from the gallery or the camera and takes five colors from it, in one of six moods (Natural, Vibrant, Light, Muted, Deep, Dark), and marks where each color comes from. The photo is read on the device; nothing is uploaded
- **Saved palettes**: Save a palette, reopen it later, export or delete it from the Palettes tab
- **Full-screen palette**: The full-screen button next to Save shows the palette over the whole screen; tap anywhere to go back
- **Copy in any format**: Tap a swatch to copy its HEX value, long press for RGB, HSL or HSV
- **Export to Drawing Applications**: Export color palettes in multiple formats:
  - Adobe Swatch Exchange (ASE) for Photoshop and other Adobe applications
  - Procreate Swatches for the popular iPad drawing app
- **Languages**: English, Brazilian Portuguese and Spanish, picked from the device's preferred languages
- **Cross-Platform**: Works on web, iOS, and Android. Windows 1024 px wide or more get a three-column workspace, and upright tablets get Color and Palettes side by side in one screen. Phones stay in portrait; tablets turn

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v26+, see `.tool-versions`)
- [Yarn](https://yarnpkg.com/) (v4.18.1+)
- [Expo CLI](https://docs.expo.dev/workflow/expo-cli/)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/redvulps/colorixer.git
   cd colorixer
   ```

2. Install dependencies
   ```bash
   yarn install
   ```

3. Start the development server
   ```bash
   yarn start
   ```

4. Open the app
   - Use the Expo Go app on your mobile device
   - Run in an iOS or Android simulator
   - Open in a web browser

## Unit and screen tests

```bash
yarn test:ci   # run once
yarn test      # watch mode
```

Tests live next to the code in `__tests__` folders and run with Jest (`jest-expo`) and React Native Testing Library. They cover the color math, the layout breakpoints, the palette store and the Color, Palettes, tablet and desktop screens. Native modules (storage, clipboard, haptics, safe area) are mocked in `jest.setup.ts`.

## End-to-end tests

E2E flows live in `.maestro/` and run with [Maestro](https://maestro.dev) against a release build of the app.

Prerequisites:
- [Maestro CLI](https://docs.maestro.dev/getting-started/installing-maestro)
- A full JDK 17+ for the Android build (`JAVA_HOME` must provide `javac`; Android Studio's bundled JBR works)
- A running Android emulator on Android 13+ (some checks read the system clipboard overlay and share sheet)

1. Build and install the release app
   ```bash
   yarn android --variant release --device <avd-name>
   ```

2. Run the flows (`adb devices` lists the serials)
   ```bash
   yarn test:e2e --udid <device-serial>
   ```

The flows are platform-agnostic. Android-only checks live in `.maestro/subflows/android-*` and run behind `when: platform: Android`. On macOS, run them against an iOS simulator with `yarn ios --configuration Release` and `yarn test:e2e --udid <simulator-udid>`.

## Usage

1. **Select a Base Color**: Drag on the color wheel, or use the H, S and V (or H, S and L) sliders and fields
2. **Choose a Harmony Type**: Tap one of the harmony diagrams to generate related colors; on phones the row of diagrams scrolls sideways
3. **Or start from a photo**: Tap the image button, pick From gallery or From camera, choose a mood, then Use palette; Choose another takes a new photo
4. **Save**: Keep the palette in the Palettes tab (Palettes at the top on upright tablets, the sidebar on wide screens)
5. **Export**: Share your palette with drawing applications in your preferred format

## How the colors are made

### The color wheel

The wheel is the painter's RYB circle, with red, yellow and blue as primaries, so complements are the ones artists expect: red and green, blue and orange, yellow and violet. The circle follows Gossett and Chen's pigment-mixing model ("Paint Inspired Color Mixing and Compositing for Visualization", IEEE InfoVis 2004): each corner of the RYB cube stands for a pigment color, the colors in between mix trilinearly, and an RYB angle runs like an HSV hue on that cube (red 0°, orange 60°, yellow 120°, green 180°, blue 240°, violet 300°).

`src/utils/ryb.ts` turns RGB hues into RYB angles and back; the wheel places markers and reads touches through it, and `scripts/generate-color-wheel.js` draws `assets/images/color-wheel.png` with the same model. The H slider and the copied HSV/HSL values keep the usual RGB hue.

### Harmonies

Every harmony gives five colors, the base first. Hues turn on the RYB wheel; some positions also take a lighter or darker version of the base or of a partner, moved by a depth *d*:

| Harmony | Hue turns (RYB degrees) | Saturation and brightness |
|---|---|---|
| Analogous | 0, −18, +18, −36, +36 | as the base |
| Complementary | 0, 180, 0, 180, 0 | positions 3–5 at *d* = ¼, ⅓, ½ |
| Split complementary | 0, 198, 162, 0, 198 | positions 4–5 at *d* = ½ |
| Triadic | 0, −120, +120, 0, −120 | positions 4–5 at *d* = ⅓, ½ |
| Square | 0, −90, 180, +90, 0 | position 5 at *d* = ⅓ |
| Compound | 0, −30, −150, 180, 0 | position 5 at *d* = ⅓ |
| Shades | the base hue | brightness −0.14, −0.30, −0.46, −0.62 |
| Monochromatic | the base hue | *d* = 0.2, 0.4, 0.6, 0.8 |

- A depth lowers saturation and brightness by *d*. Saturation that would fall under 0.1 bounces back up from it. Brightness that would fall under 0.2 goes up by *d* instead on a dark base (brightness up to 0.6), so the color stays visible, and stops at 0.2 on a light one.
- Shades starts again from the light end, adding 0.8, when brightness would reach 0.2 or less.
- Greys, white and black have no hue to lend, so their variations stay grey.

The five-color structure and the starting sizes come from a black-box study of Adobe Color's harmony tool: its outputs were measured for known base colors, and none of its code was read or used. The hue curve is Gossett and Chen's, not Adobe's. The sizes live as constants in `src/utils/harmonies/index.ts`.

Saved palettes keep the colors they were saved with. Palettes saved before the RYB wheel get their colors worked out once from the previous RGB rules (`src/utils/harmonies/legacy`), and an open saved palette shows its own colors until the color or the harmony changes.

### Palettes from images

The extraction (`src/utils/extract.ts`) follows published, open methods rather than any one app:

1. **Shrink** the image to 100 px on its longest side on the device with `expo-image-manipulator`, and read its pixels from the PNG it writes (`src/utils/png.ts`, inflated with `fflate`); nothing is uploaded.
2. **Group** the pixels with Wu's color quantizer (Xiaolin Wu, Graphics Gems II, 1991) into 24 groups, then refine them with a weighted k-means in OKLab (Björn Ottosson, 2020), the way Material Color Utilities finds a wallpaper's colors. Each group's color is the average of its pixels, so it comes from the image.
3. **Score** the groups for a mood. Moods are lightness × chroma targets in OKLCH, in the spirit of the profiles in Android's Palette library; a color in the mood's ranges ranks first, then by closeness to the targets, weighting lightness 0.52, chroma 0.24 and area 0.24.
4. **Pick** five colors at least 0.1 apart in OKLab, so the palette stays varied; the distance relaxes when an image has too few distinct colors.

| Mood | Lightness (L) | Chroma (C) |
|---|---|---|
| Natural | by area only | by area only |
| Vibrant | 0.50–0.88, aiming at 0.68 | at least 0.11, aiming at 0.26 |
| Light | from 0.74, aiming at 0.88 | aiming at 0.08 |
| Muted | 0.42–0.90, aiming at 0.68 | 0.015–0.095, aiming at 0.05 |
| Deep | 0.30–0.62, aiming at 0.46 | at least 0.08, aiming at 0.20 |
| Dark | up to 0.42, aiming at 0.27 | aiming at 0.10 |

## Languages

The app speaks English, Brazilian Portuguese and Spanish, and follows the device: it takes the first of the person's preferred languages that it speaks (`expo-localization`). Any Portuguese gets Brazilian Portuguese, any Spanish gets Spanish, and anything else falls back to English. There is no language setting in the app.

- Texts live in `src/i18n`: `en.ts` defines every key, and `pt-BR.ts` and `es.ts` must give the same keys with the same `{placeholders}`; TypeScript and `src/i18n/__tests__` check both. Texts that depend on a count give a `one` and an `other` form.
- `t(key, params)` returns the text in the current language; dates go through `formatShortDate`.
- Copied values (`hsl(…)`, `rgb(…)`, hex) and format names (HEX, RGB, HSL, HSV) are not translated.
- iOS permission texts are translated in `locales/pt-BR.json` and `locales/es.json`, registered under `locales` in `app.json`.
- To check a language on an Android 13+ emulator without changing the system: `adb shell cmd locale set-app-locales com.redvulps.colorixer --locales pt-BR` (an empty `--locales ""` goes back to the system language).

## Supported Export Formats

### Adobe Swatch Exchange (ASE)
Compatible with Adobe applications including:
- Photoshop
- Illustrator
- InDesign
- And other Creative Cloud apps

### Procreate Swatches
Ready to import directly into the Procreate app on iPad.

## Development

Colorixer is built with:
- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [Chroma.js](https://gka.github.io/chroma.js/) for color manipulation

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0) - see the LICENSE file for details.

## Acknowledgments

- [Chroma.js](https://gka.github.io/chroma.js/) for the excellent color manipulation library
- Nathan Gossett and Baoquan Chen, "Paint Inspired Color Mixing and Compositing for Visualization" (IEEE InfoVis 2004), for the RYB color model
- Xiaolin Wu's color quantizer (Graphics Gems II, 1991) and Björn Ottosson's [OKLab](https://bottosson.github.io/posts/oklab/), for image extraction
- Android's [Palette](https://developer.android.com/develop/ui/views/graphics/palette-colors) library and Google's [Material Color Utilities](https://github.com/material-foundation/material-color-utilities), whose approaches inspire the extraction moods and scoring
- The open-source community for invaluable resources and inspiration
