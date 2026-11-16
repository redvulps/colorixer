const { withAndroidManifest } = require('expo/config-plugins');

/**
 * The CAMERA permission makes Google Play take the camera as required, so devices
 * without one (many tablets and Chromebooks) can't install the app. The camera is
 * one of two ways to bring in a photo, so it is declared optional here.
 */
const FEATURES = ['android.hardware.camera', 'android.hardware.camera.autofocus'];

module.exports = function withOptionalCamera(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const declared = manifest['uses-feature'] ?? [];
    const others = declared.filter((feature) => !FEATURES.includes(feature.$['android:name']));
    manifest['uses-feature'] = [
      ...others,
      ...FEATURES.map((name) => ({ $: { 'android:name': name, 'android:required': 'false' } })),
    ];
    return config;
  });
};
