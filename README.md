# Colorixer: Advanced Color Palette Creator

Colorixer is a powerful color picker application that helps artists and designers create harmonious color palettes and export them to popular drawing applications.

## Features

- **Interactive Color Picker**: Select colors with precision using an intuitive color wheel interface
- **Color Harmony Generation**: Create harmonious color schemes with various relationships including:
  - Analogous
  - Complementary
  - Triadic
  - And more
- **Export to Drawing Applications**: Export color palettes in multiple formats:
  - Adobe Swatch Exchange (ASE) for Photoshop and other Adobe applications
  - Procreate Swatches for the popular iPad drawing app
- **Cross-Platform**: Works on web, iOS, and Android platforms

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

1. **Select a Base Color**: Use the color wheel to pick your primary color
2. **Choose a Harmony Type**: Select from different harmony types to generate related colors
3. **View and Customize**: See your generated color palette
4. **Export**: Share your palette with drawing applications in your preferred format

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
- The open-source community for invaluable resources and inspiration
