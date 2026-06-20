import type {
  Artboard,
  GeneratedImage,
  GenerationConfig,
  LayoutElement,
} from '../../types';

export interface GenerationConfigState {
  platform: any;
  resolution: any;
  customSize: any;
  style: any;
  description: string;
  pageName: string;
  keywords: any;
  enableDesignTokens: boolean;
  designTokens: any;
  background: any;
  highQuality: boolean;
  forceChinese: boolean;
  promptLanguage: string | null;
  preferredImageApiId: string | null;
  batchOutputMode: any;
  specMode: any;
  pages: any[];
  colorImage: File | null;
  referenceImages: string[];
  isBatchMode: boolean;
  designMdContent: string | null;
  visualStyleContent: string | null;
  layoutDensityContent: string | null;
  activeRole?: string;
  mediaAspectRatio?: string;
  mediaResolution?: { id: string; name: string; width: number; height: number; ratio: string };
  mediaType?: string;
  skillMode?: boolean;
  activeSkill?: string | null;
  skillConfig?: any;
  setDescription: (s: string) => void;
  setPages: (p: any[]) => void;
  setCustomStyles: (cb: (prev: any[]) => any[]) => void;
  setStyle: (s: any) => void;
  setIsAutoGeneratingPages: (b: boolean) => void;
}

export interface GenerationCanvasState {
  layoutImage: string | null;
  layoutElements: LayoutElement[];
  layoutAnalysis: string | null;
  setLayoutAnalysis: (s: string | null) => void;
  setArtboards: (cb: (prev: Artboard[]) => Artboard[]) => void;
  setArtboardGroups: (cb: (prev: any[]) => any[]) => void;
  handleSaveToHistory: (img: GeneratedImage) => Promise<void>;
  getImageDimensions: (b: string) => Promise<{ width: number; height: number }>;
  artboardGroups: any[];
  artboards: Artboard[];
}

export interface GenerationReviewData {
  prompt: string;
  config: GenerationConfig;
  pendingAction: () => void;
  images: { label: string; url: string }[];
  layoutAnalysis?: string | null;
  apiRequestInfo?: {
    targetAPI: {
      provider: string;
      baseUrl: string;
      model: string;
      name: string;
    };
    requestParams: {
      prompt: string;
      aspectRatio: string;
      preferredApiId?: string | null;
      images: {
        hasColorImage: boolean;
        hasStyleImage: boolean;
        hasLayoutImage: boolean;
        hasEditImage: boolean;
        hasMaskImage: boolean;
        contentImageCount: number;
      };
    };
  };
}

export interface RegenState {
  isOpen: boolean;
  artboardId: string | null;
  targetImage: string | null;
  mode: 'refine' | 'new';
  prompt: string;
  referenceImage: string | null;
  layoutImage: string | null;
  layoutElements: LayoutElement[];
  maskImage: string | null;
}

export interface GeneratedAssetResult {
  id: string;
  url: string;
  base64: string;
  prompt: string;
  timestamp: number;
}
