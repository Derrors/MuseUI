import { StickerDesignConfig } from '../../types';
import { buildStickerCraftPrompt } from '../../domain/stickers/prompting';

interface StickerConstants {
  styles: Array<{ id: string; promptModifier: string }>;
  shapes: Array<{ id: string; promptModifier: string }>;
  themes: Array<{ id: string; promptModifier: string }>;
  sizes: Array<{ id: string; promptModifier: string }>;
  backgrounds: Array<{ id: string; promptModifier: string }>;
}

export function buildStickerDesignPrompt(
  content: string,
  config: StickerDesignConfig,
  constants: StickerConstants,
): string {
  return buildStickerCraftPrompt(content, config, constants);
}
