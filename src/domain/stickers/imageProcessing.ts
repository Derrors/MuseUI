import type { ImageCropBox, StickerAssetItem, StickerSplitSource } from '../../types';
import { createId } from '../../utils/id';

// Inspired by Leochens/StickerCraft image-processing behavior and adapted for MuseUI.

export interface TransparencyRepairOptions {
  backgroundColor?: 'black' | 'white';
  tolerance?: number;
}

export interface TransparencyRepairResult {
  url: string;
  changed: boolean;
  backgroundRemoved: boolean;
  reason?: string;
}

export interface StickerSplitResult {
  items: StickerAssetItem[];
  sourceWidth: number;
  sourceHeight: number;
}

const DEFAULT_TOLERANCE = 42;
const MIN_ALPHA_PIXELS_RATIO = 0.01;
const MIN_COMPONENT_AREA_RATIO = 0.002;

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load sticker image'));
    img.src = url;
  });

const createCanvasFromUrl = async (url: string): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> => {
  const image = await loadImage(url);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas is not available for sticker processing');
  ctx.drawImage(image, 0, 0);
  return { canvas, ctx };
};

const colorDistance = (data: Uint8ClampedArray, index: number, rgb: [number, number, number]) => {
  const dr = data[index] - rgb[0];
  const dg = data[index + 1] - rgb[1];
  const db = data[index + 2] - rgb[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

const hasExistingTransparency = (data: Uint8ClampedArray): boolean => {
  let transparentPixels = 0;
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 245) transparentPixels++;
  }
  return transparentPixels / (data.length / 4) > MIN_ALPHA_PIXELS_RATIO;
};

const getTargetRgb = (color: 'black' | 'white'): [number, number, number] =>
  color === 'black' ? [0, 0, 0] : [255, 255, 255];

const pixelOffset = (x: number, y: number, width: number) => (y * width + x) * 4;

const enqueueEdgePixels = (
  queue: number[],
  visited: Uint8Array,
  width: number,
  height: number,
  data: Uint8ClampedArray,
  target: [number, number, number],
  tolerance: number,
) => {
  const tryAdd = (x: number, y: number) => {
    const pixel = y * width + x;
    if (visited[pixel]) return;
    const index = pixel * 4;
    if (data[index + 3] < 16 || colorDistance(data, index, target) <= tolerance) {
      visited[pixel] = 1;
      queue.push(pixel);
    }
  };

  for (let x = 0; x < width; x++) {
    tryAdd(x, 0);
    tryAdd(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryAdd(0, y);
    tryAdd(width - 1, y);
  }
};

export const repairStickerTransparency = async (
  url: string,
  options: TransparencyRepairOptions = {},
): Promise<TransparencyRepairResult> => {
  const { canvas, ctx } = await createCanvasFromUrl(url);
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  if (hasExistingTransparency(data)) {
    return {
      url,
      changed: false,
      backgroundRemoved: true,
      reason: 'already-transparent',
    };
  }

  const target = getTargetRgb(options.backgroundColor ?? 'white');
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];
  enqueueEdgePixels(queue, visited, width, height, data, target, tolerance);

  let removed = 0;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const pixel = queue[cursor];
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    const index = pixel * 4;
    data[index + 3] = 0;
    removed++;

    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nextPixel = ny * width + nx;
      if (visited[nextPixel]) continue;
      const nextIndex = nextPixel * 4;
      if (data[nextIndex + 3] < 16 || colorDistance(data, nextIndex, target) <= tolerance) {
        visited[nextPixel] = 1;
        queue.push(nextPixel);
      }
    }
  }

  if (removed === 0) {
    return {
      url,
      changed: false,
      backgroundRemoved: false,
      reason: 'no-connected-background-found',
    };
  }

  ctx.putImageData(imageData, 0, 0);
  return {
    url: canvas.toDataURL('image/png'),
    changed: true,
    backgroundRemoved: true,
  };
};

const sampleEdgeBackground = (data: Uint8ClampedArray, width: number, height: number): [number, number, number] => {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  const add = (x: number, y: number) => {
    const index = pixelOffset(x, y, width);
    r += data[index];
    g += data[index + 1];
    b += data[index + 2];
    count++;
  };

  for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 40))) {
    add(x, 0);
    add(x, height - 1);
  }
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 40))) {
    add(0, y);
    add(width - 1, y);
  }

  return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
};

const buildForegroundMask = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  background: [number, number, number],
): Uint8Array => {
  const mask = new Uint8Array(width * height);
  const hasAlpha = hasExistingTransparency(data);
  for (let pixel = 0; pixel < width * height; pixel++) {
    const index = pixel * 4;
    const alpha = data[index + 3];
    if (alpha < 20) continue;
    if (hasAlpha) {
      mask[pixel] = 1;
      continue;
    }
    if (colorDistance(data, index, background) > 36) {
      mask[pixel] = 1;
    }
  }
  return mask;
};

const expandBox = (box: ImageCropBox, width: number, height: number, margin: number): ImageCropBox => ({
  minX: Math.max(0, box.minX - margin),
  minY: Math.max(0, box.minY - margin),
  maxX: Math.min(width - 1, box.maxX + margin),
  maxY: Math.min(height - 1, box.maxY + margin),
});

const cropToDataUrl = (
  source: HTMLCanvasElement,
  box: ImageCropBox,
  transparent = true,
): string => {
  const width = Math.max(1, box.maxX - box.minX + 1);
  const height = Math.max(1, box.maxY - box.minY + 1);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available for sticker crop');
  if (!transparent) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(source, box.minX, box.minY, width, height, 0, 0, width, height);
  return canvas.toDataURL('image/png');
};

const findComponents = (mask: Uint8Array, width: number, height: number): Array<ImageCropBox & { area: number }> => {
  const visited = new Uint8Array(width * height);
  const components: Array<ImageCropBox & { area: number }> = [];
  const minArea = Math.max(24, Math.round(width * height * MIN_COMPONENT_AREA_RATIO));

  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || visited[start]) continue;
    const queue = [start];
    visited[start] = 1;
    let area = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    for (let cursor = 0; cursor < queue.length; cursor++) {
      const pixel = queue[cursor];
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      area++;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      const neighbors = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const next = ny * width + nx;
        if (!mask[next] || visited[next]) continue;
        visited[next] = 1;
        queue.push(next);
      }
    }

    if (area >= minArea) {
      components.push({ minX, minY, maxX, maxY, area });
    }
  }

  return components.sort((a, b) => (a.minY - b.minY) || (a.minX - b.minX));
};

export const splitStickerCollectionDetailed = async (url: string): Promise<StickerSplitResult> => {
  const { canvas, ctx } = await createCanvasFromUrl(url);
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const background = sampleEdgeBackground(imageData.data, width, height);
  const mask = buildForegroundMask(imageData.data, width, height, background);
  const components = findComponents(mask, width, height);

  const items = components.map((component, index) => {
    const box = expandBox(component, width, height, Math.max(8, Math.round(Math.min(width, height) * 0.018)));
    const splitSource: StickerSplitSource = {
      box,
      sourceWidth: width,
      sourceHeight: height,
    };
    return {
      id: createId('sticker-item'),
      url: cropToDataUrl(canvas, box),
      prompt: `Sticker item ${index + 1}`,
      splitIndex: index,
      splitMethod: 'auto' as const,
      splitSource,
    };
  });

  return { items, sourceWidth: width, sourceHeight: height };
};

export const splitStickerCollectionByGridDetailed = async (
  url: string,
  rows: number,
  columns: number,
): Promise<StickerSplitResult> => {
  const safeRows = Math.max(1, Math.min(8, Math.round(rows)));
  const safeColumns = Math.max(1, Math.min(8, Math.round(columns)));
  const { canvas } = await createCanvasFromUrl(url);
  const cellWidth = Math.floor(canvas.width / safeColumns);
  const cellHeight = Math.floor(canvas.height / safeRows);
  const items: StickerAssetItem[] = [];

  for (let row = 0; row < safeRows; row++) {
    for (let column = 0; column < safeColumns; column++) {
      const minX = column * cellWidth;
      const minY = row * cellHeight;
      const maxX = column === safeColumns - 1 ? canvas.width - 1 : (column + 1) * cellWidth - 1;
      const maxY = row === safeRows - 1 ? canvas.height - 1 : (row + 1) * cellHeight - 1;
      const box = { minX, minY, maxX, maxY };
      items.push({
        id: createId('sticker-item'),
        url: cropToDataUrl(canvas, box),
        prompt: `Sticker item ${items.length + 1}`,
        splitIndex: items.length,
        splitMethod: 'manual',
        splitSource: {
          box,
          sourceWidth: canvas.width,
          sourceHeight: canvas.height,
        },
      });
    }
  }

  return { items, sourceWidth: canvas.width, sourceHeight: canvas.height };
};

export const recropStickerFromSource = async (
  sourceUrl: string,
  source: StickerSplitSource,
): Promise<string> => {
  const { canvas } = await createCanvasFromUrl(sourceUrl);
  const adjustments = source.cropAdjustments ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const box = expandBox({
    minX: source.box.minX - adjustments.left,
    minY: source.box.minY - adjustments.top,
    maxX: source.box.maxX + adjustments.right,
    maxY: source.box.maxY + adjustments.bottom,
  }, canvas.width, canvas.height, 0);
  return cropToDataUrl(canvas, box);
};
