
export type PlatformType = 'mobile' | 'pc' | 'tablet' | 'browser';
export type LangType = 'en' | 'zh';
export type StudioType = 'ui-designer' | 'media-studio' | 'game-studio';
export type CreatorRole = 'designer' | 'media' | 'game' | 'cover-image' | 'infographic' | 'xhs-images' | 'comic' | 'article-illustrator' | 'slide-deck' | 'logo' | 'sticker-design' | 'free';

// ==========================================
// SKILL SYSTEM
// ==========================================

export type SkillType = 'cover-image' | 'infographic' | 'xhs-images' | 'comic' | 'article-illustrator' | 'slide-deck' | 'logo' | 'sticker-design';

export interface SkillOption {
  id: string;
  name: string;
  name_zh: string;
  description: string;
  description_zh?: string;
  promptModifier: string;
}

// --- Cover Image ---
export type CoverType = 'hero' | 'conceptual' | 'typography' | 'metaphor' | 'scene' | 'minimal';
export type CoverPalette = 'warm' | 'elegant' | 'cool' | 'dark' | 'earth' | 'vivid' | 'pastel' | 'mono' | 'retro';
export type CoverRendering = 'flat-vector' | 'hand-drawn' | 'painterly' | 'digital' | 'pixel' | 'chalk';
export type CoverText = 'none' | 'title-only' | 'title-subtitle' | 'text-rich';
export type CoverMood = 'subtle' | 'balanced' | 'bold';
export type CoverFont = 'clean' | 'handwritten' | 'serif' | 'display';

export interface CoverImageConfig {
  type: CoverType;
  palette: CoverPalette;
  rendering: CoverRendering;
  text: CoverText;
  mood: CoverMood;
  font: CoverFont;
  title: string;
  subtitle: string;
  aspect: MediaAspectRatio;
}

// --- Infographic ---
export type InfographicLayout =
  | 'linear-progression' | 'binary-comparison' | 'comparison-matrix'
  | 'hierarchical-layers' | 'tree-branching' | 'hub-spoke'
  | 'structural-breakdown' | 'bento-grid' | 'iceberg' | 'bridge'
  | 'funnel' | 'isometric-map' | 'dashboard' | 'periodic-table'
  | 'comic-strip' | 'story-mountain' | 'jigsaw' | 'venn-diagram'
  | 'winding-roadmap' | 'circular-flow' | 'dense-modules';

export type InfographicStyle =
  | 'craft-handmade' | 'claymation' | 'kawaii' | 'storybook-watercolor'
  | 'chalkboard' | 'cyberpunk-neon' | 'bold-graphic' | 'aged-academia'
  | 'corporate-memphis' | 'technical-schematic' | 'origami' | 'pixel-art'
  | 'ui-wireframe' | 'subway-map' | 'ikea-manual' | 'knolling'
  | 'lego-brick' | 'pop-laboratory' | 'morandi-journal' | 'retro-pop-grid';

export interface InfographicConfig {
  layout: InfographicLayout;
  style: InfographicStyle;
  aspect: 'landscape' | 'portrait' | 'square';
}

// --- XHS Images ---
export type XHSStyle = 'cute' | 'fresh' | 'warm' | 'bold' | 'minimal' | 'retro' | 'pop' | 'notion' | 'chalkboard' | 'study-notes';
export type XHSLayout = 'sparse' | 'balanced' | 'dense' | 'list' | 'comparison' | 'flow' | 'mindmap' | 'quadrant';
export type XHSStrategy = 'story-driven' | 'info-dense' | 'visual-first';

export interface XHSImagesConfig {
  style: XHSStyle;
  layout: XHSLayout;
  strategy: XHSStrategy;
}

// --- Comic ---
export type ComicArt = 'ligne-claire' | 'manga' | 'realistic' | 'ink-brush' | 'chalk';
export type ComicTone = 'neutral' | 'warm' | 'dramatic' | 'romantic' | 'energetic' | 'vintage' | 'action';
export type ComicLayout = 'standard' | 'cinematic' | 'dense' | 'splash' | 'mixed' | 'webtoon';
export type ComicPreset = 'ohmsha' | 'wuxia' | 'shoujo' | 'custom';

export interface ComicConfig {
  art: ComicArt;
  tone: ComicTone;
  layout: ComicLayout;
  preset: ComicPreset;
  aspect: '3:4' | '4:3' | '16:9';
  pageCount: number;
}

// --- Article Illustrator ---
export type ArticleType = 'infographic' | 'scene' | 'flowchart' | 'comparison' | 'framework' | 'timeline';
export type ArticleDensity = 'minimal' | 'balanced' | 'per-section' | 'rich';

export interface ArticleIllustratorConfig {
  type: ArticleType;
  style: string;
  density: ArticleDensity;
}

// --- Slide Deck ---
export type SlidePreset =
  | 'blueprint' | 'chalkboard' | 'corporate' | 'minimal' | 'sketch-notes'
  | 'watercolor' | 'dark-atmospheric' | 'notion' | 'bold-editorial'
  | 'editorial-infographic' | 'fantasy-animation' | 'intuition-machine'
  | 'pixel-art' | 'scientific' | 'vector-illustration' | 'vintage';

export type SlideAudience = 'beginners' | 'intermediate' | 'experts' | 'executives' | 'general';

export interface SlideDeckConfig {
  preset: SlidePreset;
  audience: SlideAudience;
}

// --- Logo ---
export type LogoType = 'wordmark' | 'lettermark' | 'icon' | 'combination' | 'emblem' | 'mascot' | 'abstract';
export type LogoStyle = 'flat' | 'gradient' | '3d' | 'line-art' | 'geometric' | 'hand-drawn' | 'vintage' | 'pixel';
export type LogoPalette = 'monochrome' | 'dual-tone' | 'colorful' | 'gradient-colors' | 'earth-tones' | 'pastel' | 'bold-contrast';
export type LogoIndustry = 'tech' | 'food' | 'fashion' | 'sports' | 'education' | 'health' | 'finance' | 'creative' | 'eco' | 'general';
export type LogoMood = 'playful' | 'professional' | 'elegant' | 'bold' | 'minimal' | 'friendly';
export type LogoSize = '1:1' | '4:3' | '16:9' | '3:4' | '2:1';

export interface LogoConfig {
  type: LogoType;
  style: LogoStyle;
  palette: LogoPalette;
  industry: LogoIndustry;
  mood: LogoMood;
  size: LogoSize;
  brandName: string;
  slogan: string;
}

// --- Sticker Design ---
export type StickerStyle = 'flat' | 'chibi' | 'puffy-3d' | 'enamel-pin' | 'chrome-badge' | 'die-cut' | 'vintage';
export type StickerShape = 'custom' | 'circle' | 'square' | 'rounded' | 'star' | 'heart';
export type StickerTheme = 'character' | 'emoji' | 'text-quote' | 'object' | 'animal' | 'food' | 'nature';
export type StickerSize = 'small' | 'medium' | 'large' | 'sheet';
export type StickerBackground = 'transparent' | 'white' | 'colored' | 'pattern';
export type StickerLayoutMode = 'single' | 'three-views' | 'collection';
export type StickerBackgroundMode = 'transparent' | 'keep';

export interface StickerTextConfig {
  enabled: boolean;
  content: string;
  font: 'rounded' | 'bold' | 'handwritten' | 'display';
  hasBorder: boolean;
}

export interface StickerCollectionConfig {
  count: number;
  itemPrompts: string[];
}

export interface StickerDesignConfig {
  style: StickerStyle;
  shape: StickerShape;
  theme: StickerTheme;
  size: StickerSize;
  background: StickerBackground;
  subjectName: string;
  expression: string;
  aspect: MediaAspectRatio;
  layoutMode?: StickerLayoutMode;
  backgroundMode?: StickerBackgroundMode;
  useStickerBorder?: boolean;
  allowFacialFeatures?: boolean;
  textOverlay?: StickerTextConfig;
  referenceImage?: string | null;
  collection?: StickerCollectionConfig;
}

// --- Unified Skill Config ---
export interface SkillConfig {
  type: SkillType;
  coverImage?: CoverImageConfig;
  infographic?: InfographicConfig;
  xhsImages?: XHSImagesConfig;
  comic?: ComicConfig;
  articleIllustrator?: ArticleIllustratorConfig;
  slideDeck?: SlideDeckConfig;
  logo?: LogoConfig;
  stickerDesign?: StickerDesignConfig;
}

export type MediaAspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9' | '2:3' | '3:2';
export type MediaType = 'video-cover' | 'poster' | 'book-page' | 'social-post' | 'banner';

export interface MediaResolutionPreset {
  id: string;
  name: string;
  name_zh: string;
  width: number;
  height: number;
  ratio: MediaAspectRatio;
}

export interface MediaTypeOption {
  id: MediaType;
  name: string;
  name_zh: string;
  promptDesc: string;
  promptDesc_zh: string;
}

export interface LayoutElement {
  id: string;
  typeId: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number; // Rotation in degrees
  color: string;
  drawType: string;
  src?: string; // For images
  note?: string; // Custom instructions for the model
  points?: { x: number; y: number }[]; // For brush strokes
  strokeWidth?: number;
  strokeColor?: string;
}

// Renamed from DevicePreset to ResolutionPreset
export interface ResolutionPreset {
  id: string;
  name: string;
  name_zh?: string;
  width: number;
  height: number;
  type: PlatformType;
}

export interface UIStyle {
  id: string;
  name: string;
  name_zh?: string;
  category: 'Mainstream' | 'Creative' | 'Niche' | 'Special' | 'Wireframe' | 'Custom';
  description: string;
  description_zh?: string;
  promptModifier: string;
}

export interface DesignTokens {
  aiColor?: boolean;       // NEW: Allow AI to decide colors
  primaryColor: string;    // Main Theme Color
  backgroundColor: string; // App Interface Background
  accentColor: string;     // CTA / Highlights
  decorativeColor: string; // Secondary / Decorative
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full';
  spacing: 'compact' | 'comfortable' | 'spacious';
}

export interface BackgroundConfig {
  type: 'color' | 'image';
  value: string; // Hex code or Base64 data
}

export interface PageRequest {
  id: string;
  name: string;
  description: string;
  referenceImage?: string; // Base64 string for per-page reference
  layoutImage?: string;    // Base64 string for per-page layout
  layoutElements?: LayoutElement[]; // Layout elements for per-page builder
}

// NEW: Structured Design System for Code Generation
export interface DesignSystem {
  palette: { name: string; hex: string; usage: string }[];
  typography: { name: string; size: string; weight: string; usage: string }[];
  measurements: {
    borderRadius: string; // e.g. "8px"
    spacingUnit: string; // e.g. "16px"
    gap: string;
  };
  styles: {
    gradient?: string;
    glassOpacity?: number; // 0 to 1
    shadows: {
      small: string;
      medium: string;
      large: string;
    };
  };
  globalStyleConstraint: string; // New field: Overall style prompt injection
  components: {
    buttonPrimary: { bg: string; text: string; radius: string };
    card: { bg: string; border: string; radius: string };
  };
}

export interface GenerationConfig {
  platform: PlatformType;
  resolution: ResolutionPreset; // Changed from device
  customSize: { width: number; height: number; active: boolean };
  description: string; // Global description in batch mode
  pageName: string; // e.g., "Login Screen", "Dashboard"
  keywords: string[];
  style: UIStyle;
  highQuality: boolean; // Toggles between flash and pro (legacy)
  preferredImageApiId: string | null; // Specific image API to use, null = default priority
  enableDesignTokens: boolean; // Toggle for strict design tokens
  designTokens: DesignTokens;
  background: BackgroundConfig; // Controls the SCENE background (behind device)
  forceChinese: boolean; // Force Chinese text generation (legacy)
  promptLanguage: string | null; // null = no constraint, 'zh' / 'en' / 'ja' / 'ko' etc.
  batchOutputMode: 'separate' | 'grid'; // NEW: Output mode for batch generation
  specMode: 'image' | 'code'; // NEW: Toggle between Image Gen and Code/JSON Gen for specs
  designMd?: string; // DESIGN.md content injected into prompt
  visualStyle?: string; // Visual style template content (from baoyu-skills) injected into prompt
  layoutDensity?: string; // Layout density strategy injected into prompt
  // Media mode
  activeRole?: CreatorRole;
  mediaAspectRatio?: MediaAspectRatio;
  mediaType?: MediaType;
  // Skill mode
  skillMode?: boolean;
  skillConfig?: SkillConfig;
}

export interface GeneratedImage {
  id: string;
  imageId?: string;
  url: string; // Base64 data URL
  prompt: string;
  timestamp: number;
  // Metadata for tooltips
  details?: {
    platform: string;
    resolution: string; // Changed from device
    style: string;
    tokens: DesignTokens;
    fullPrompt: string;
    isDesignSpec?: boolean;
    batchId?: string; // NEW: To group images generated together
    originalDescription?: string; // NEW: Persist original description for regeneration context
    projectId?: string; // NEW: To filter by project
    designSystem?: DesignSystem; // NEW: Store the JSON spec if generated via code
    // NEW: Store snapshots of reference images used for this generation
    referenceImages?: {
      label: string;
      url: string; // Base64
    }[];
    sticker?: StickerAssetMetadata;
  };
}

export interface ImageCropBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface CropAdjustments {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface StickerSplitSource {
  box: ImageCropBox;
  sourceWidth: number;
  sourceHeight: number;
  cropAdjustments?: CropAdjustments;
}

export interface StickerAssetItem {
  id: string;
  imageId?: string;
  url: string;
  prompt: string;
  splitIndex: number;
  splitMethod?: 'auto' | 'manual';
  splitSource?: StickerSplitSource;
}

export interface StickerAssetMetadata {
  kind: 'sticker';
  transparentWorkflow: boolean;
  backgroundRemoved?: boolean;
  backgroundColor?: 'white' | 'black';
  hasStickerBorder: boolean;
  hasText: boolean;
  hasReferenceImage: boolean;
  layoutMode: StickerLayoutMode;
  isCollection: boolean;
  collectionCount?: number;
  collectionItems?: StickerAssetItem[];
  splitMethod?: 'auto' | 'manual';
  sourceType?: 'generated' | 'uploaded';
  error?: string;
}

// NEW: Canvas Types
export interface Artboard {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  image: GeneratedImage;
  history?: GeneratedImage[]; // Array of all versions for this artboard
  groupId?: string; // If part of a batch
  label: string;
  isNew?: boolean; // True when freshly generated, cleared on first click
}

export type AIProvider = 'openai';
export type OpenAIImageMode = 'images' | 'chat' | 'auto';

export type ImageAssetSource = 'generated' | 'uploaded' | 'sticker' | 'thumbnail' | 'imported';

export interface ImageAsset {
  id: string;
  dataUrl: string;
  hash: string;
  mimeType: string;
  width?: number;
  height?: number;
  source: ImageAssetSource;
  createdAt: string;
}

export interface ImageThumbnail {
  id: string;
  imageId: string;
  dataUrl: string;
  width: number;
  height: number;
  version: number;
  createdAt: string;
}

export type GenerationTaskStatus = 'running' | 'done' | 'error';

export interface GenerationTask {
  id: string;
  status: GenerationTaskStatus;
  role: CreatorRole | SkillType | string;
  prompt: string;
  fullPrompt?: string;
  apiProfileId?: string | null;
  textModel?: string | null;
  imageModel?: string | null;
  inputImageIds: string[];
  outputImageIds: string[];
  outputAssetIds: string[];
  error?: string | null;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  elapsedMs?: number | null;
  projectId?: string | null;
  artboardId?: string | null;
  batchId?: string | null;
}

export interface APIConfig {
  id: string;
  name: string;
  provider: AIProvider;
  baseUrl: string;
  apiKey: string;
  textModel?: string;
  imageModel?: string;
  enabled: boolean;
  textEnabled?: boolean;
  imageEnabled?: boolean;
  imageMode?: OpenAIImageMode;
}

export interface APISettings {
  profiles: APIConfig[];
}

export interface RequestLogEntry {
  id: string;
  timestamp: number;
  type: 'text' | 'image';
  provider: AIProvider;
  model: string;
  baseUrl: string;
  success: boolean;
  latencyMs: number;
  error?: string;
}

export interface ArtboardGroup {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// NEW: Saved Project Structure (Legacy Local)
export interface SavedProject {
  id: string;
  name: string;
  thumbnail?: string; // Base64 screenshot
  timestamp: number;
  artboards: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    imageId: string; // Reference to history item
    label: string;
    groupId?: string;
  }[];
}

// NEW: Database Project Structure
export interface Project {
  id: string;
  name: string;
  studioType: StudioType;
  description: string | null;
  thumbnailUrl: string | null;
  config: Partial<AppConfigExport>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    artboards: number;
  };
  artboards?: Artboard[];
}

// NEW: Full App Configuration Export Structure
export interface AppConfigExport {
  version: number;
  timestamp: number;
  platform: PlatformType;
  resolution: ResolutionPreset;
  customSize: { width: number; height: number; active: boolean };
  description: string;
  pageName: string;
  keywords: string[];
  style: UIStyle;
  customStyles: UIStyle[];
  enableDesignTokens: boolean;
  designTokens: DesignTokens;
  background: BackgroundConfig;
  highQuality: boolean;
  forceChinese: boolean;
  promptLanguage: string | null;
  preferredImageApiId: string | null;
  isBatchMode: boolean;
  batchOutputMode: 'separate' | 'grid';
  specMode: 'image' | 'code';
  designMdId?: string;
  designMdContent?: string;
  visualStyleId?: string;
  visualStyleContent?: string;
  layoutDensityId?: string;
  layoutDensityContent?: string;
  pages: PageRequest[];
  // Assets stored as Base64 strings for export
  styleImages: string[];
  contentImages: string[];
  layoutImage: string | null;
  layoutElements: LayoutElement[];
}
