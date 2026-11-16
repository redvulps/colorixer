import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { Pixels } from './extract';
import { base64ToBytes, decodePng } from './png';

/** Longest side, in pixels, of the copy colors are read from */
export const SAMPLE_SIZE = 100;

/** Pixels of an image file, shrunk on the device to SAMPLE_SIZE on its longest side */
export async function readPixels(uri: string, width: number, height: number): Promise<Pixels> {
  const scale = Math.min(1, SAMPLE_SIZE / Math.max(width, height));
  const context = ImageManipulator.manipulate(uri).resize(
    width >= height ? { width: Math.round(width * scale) } : { height: Math.round(height * scale) },
  );
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.PNG, base64: true });
  if (!saved.base64) throw new Error('The image could not be read');
  return decodePng(base64ToBytes(saved.base64));
}
