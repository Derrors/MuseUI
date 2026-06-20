import { useState } from 'react';
import { PlatformType, ResolutionPreset, UIStyle, DesignTokens, BackgroundConfig, PageRequest, CreatorRole, MediaAspectRatio, MediaType, MediaResolutionPreset, SkillConfig, SkillType, CoverImageConfig, InfographicConfig, XHSImagesConfig, ComicConfig, ArticleIllustratorConfig, SlideDeckConfig, LogoConfig, StickerDesignConfig } from '../types';
import { RESOLUTION_PRESETS, UI_STYLES, MEDIA_RESOLUTIONS } from '../constants';

export const useConfigState = () => {

    // Creator Role
    const [activeRole, setActiveRole] = useState<CreatorRole>('designer');

    // Skill Mode
    const SKILL_TYPES: SkillType[] = ['cover-image', 'infographic', 'xhs-images', 'comic', 'article-illustrator', 'slide-deck', 'logo', 'sticker-design'];
    const isSkillRole = (role: CreatorRole) => SKILL_TYPES.includes(role as SkillType);
    const [skillMode, setSkillMode] = useState(false);
    const [activeSkill, setActiveSkill] = useState<SkillType | null>(null);
    const [skillConfig, setSkillConfig] = useState<SkillConfig | null>(null);

    // Default skill configs
    const defaultCoverConfig: CoverImageConfig = {
        type: 'conceptual', palette: 'warm', rendering: 'flat-vector',
        text: 'title-only', mood: 'balanced', font: 'clean',
        title: '', subtitle: '', aspect: '16:9'
    };
    const defaultInfographicConfig: InfographicConfig = {
        layout: 'bento-grid', style: 'craft-handmade', aspect: 'landscape'
    };
    const defaultXHSConfig: XHSImagesConfig = {
        style: 'cute', layout: 'balanced', strategy: 'info-dense'
    };
    const defaultComicConfig: ComicConfig = {
        art: 'manga', tone: 'neutral', layout: 'standard',
        preset: 'custom', aspect: '3:4', pageCount: 6
    };
    const defaultArticleConfig: ArticleIllustratorConfig = {
        type: 'infographic', style: 'notion', density: 'balanced'
    };
    const defaultSlideConfig: SlideDeckConfig = {
        preset: 'blueprint', audience: 'general'
    };
    const defaultLogoConfig: LogoConfig = {
        type: 'combination', style: 'flat', palette: 'dual-tone',
        industry: 'general', mood: 'professional', size: '1:1',
        brandName: '', slogan: ''
    };
    const defaultStickerConfig: StickerDesignConfig = {
        style: 'flat', shape: 'custom', theme: 'character',
        size: 'medium', background: 'transparent',
        subjectName: '', expression: '', aspect: '1:1',
        layoutMode: 'single',
        backgroundMode: 'transparent',
        useStickerBorder: true,
        allowFacialFeatures: true,
        textOverlay: {
            enabled: false,
            content: '',
            font: 'rounded',
            hasBorder: true,
        },
        referenceImage: null,
        collection: {
            count: 6,
            itemPrompts: ['', '', '', '', '', ''],
        },
    };

    // Config
    const [platform, setPlatform] = useState<PlatformType>('mobile');
    const [resolution, setResolution] = useState<ResolutionPreset>(RESOLUTION_PRESETS[1]);
    const [customSize, setCustomSize] = useState({ width: 390, height: 844, active: false });
    const [customStyles, setCustomStyles] = useState<UIStyle[]>([]);
    const [style, setStyle] = useState<UIStyle>(UI_STYLES[2]);
    const [description, setDescription] = useState('');
    const [pageName, setPageName] = useState('');
    const [keywords, setKeywords] = useState<string[]>([]);
    const [enableDesignTokens, setEnableDesignTokens] = useState(false);
    const [designTokens, setDesignTokens] = useState<DesignTokens>({
        aiColor: false, primaryColor: '#3B82F6', backgroundColor: '#FFFFFF', accentColor: '#F59E0B', decorativeColor: '#10B981', borderRadius: 'medium', spacing: 'comfortable'
    });
    const [background, setBackground] = useState<BackgroundConfig>({ type: 'color', value: '#FFFFFF' });
    const [highQuality, setHighQuality] = useState(false);
    const [forceChinese, setForceChinese] = useState(false);
    const [promptLanguage, setPromptLanguage] = useState<string | null>(null);
    const [preferredImageApiId, setPreferredImageApiId] = useState<string | null>(null);
    const [designMdId, setDesignMdId] = useState<string | null>(null);
    const [designMdContent, setDesignMdContent] = useState<string | null>(null);
    const [visualStyleId, setVisualStyleId] = useState<string | null>(null);
    const [visualStyleContent, setVisualStyleContent] = useState<string | null>(null);
    const [layoutDensityId, setLayoutDensityId] = useState<string | null>(null);
    const [layoutDensityContent, setLayoutDensityContent] = useState<string | null>(null);

    // Batch & Pages (Config related)
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [batchOutputMode, setBatchOutputMode] = useState<'separate' | 'grid'>('separate');
    const [specMode, setSpecMode] = useState<'image' | 'code'>('image');
    const [pages, setPages] = useState<PageRequest[]>([]);
    const [isAutoGeneratingPages, setIsAutoGeneratingPages] = useState(false);

    // Media Mode
    const [mediaAspectRatio, setMediaAspectRatio] = useState<MediaAspectRatio>('3:4');
    const [mediaResolution, setMediaResolution] = useState<MediaResolutionPreset>(MEDIA_RESOLUTIONS.find(r => r.ratio === '3:4')!);
    const [mediaType, setMediaType] = useState<MediaType>('poster');

    // Images (Inputs)
    const [colorImage, setColorImage] = useState<File | null>(null);
    const [referenceImages, setReferenceImages] = useState<string[]>([]);
    const [copiedImageBase64, setCopiedImageBase64] = useState<string | null>(null);

    // Actions
    const handleRoleChange = (role: CreatorRole) => {
        setActiveRole(role);
        if (isSkillRole(role)) {
            setSkillMode(true);
            setActiveSkill(role as SkillType);
            // Initialize default config for the skill
            switch (role) {
                case 'cover-image':
                    setSkillConfig({ type: 'cover-image', coverImage: defaultCoverConfig });
                    break;
                case 'infographic':
                    setSkillConfig({ type: 'infographic', infographic: defaultInfographicConfig });
                    break;
                case 'xhs-images':
                    setSkillConfig({ type: 'xhs-images', xhsImages: defaultXHSConfig });
                    break;
                case 'comic':
                    setSkillConfig({ type: 'comic', comic: defaultComicConfig });
                    break;
                case 'article-illustrator':
                    setSkillConfig({ type: 'article-illustrator', articleIllustrator: defaultArticleConfig });
                    break;
                case 'slide-deck':
                    setSkillConfig({ type: 'slide-deck', slideDeck: defaultSlideConfig });
                    break;
                case 'logo':
                    setSkillConfig({ type: 'logo', logo: defaultLogoConfig });
                    break;
                case 'sticker-design':
                    setSkillConfig({ type: 'sticker-design', stickerDesign: defaultStickerConfig });
                    break;
            }
        } else {
            setSkillMode(false);
            setActiveSkill(null);
            setSkillConfig(null);
        }
    };

    const handlePlatformChange = (p: PlatformType) => {
        setPlatform(p);
        const firstRes = RESOLUTION_PRESETS.find(d => d.type === p);
        if (firstRes) setResolution(firstRes);
    };

    const handleMediaAspectRatioChange = (ratio: MediaAspectRatio) => {
        setMediaAspectRatio(ratio);
        const firstRes = MEDIA_RESOLUTIONS.find(r => r.ratio === ratio);
        if (firstRes) setMediaResolution(firstRes);
    };

    return {
        // Role
        activeRole, setActiveRole: handleRoleChange,

        // Skill Mode
        skillMode, activeSkill, skillConfig,
        setSkillMode, setActiveSkill, setSkillConfig,

        // State
        platform, resolution, customSize, customStyles, style, description, pageName, keywords,
        enableDesignTokens, designTokens, background, highQuality, forceChinese,
        promptLanguage, preferredImageApiId,
        designMdId, designMdContent, visualStyleId, visualStyleContent, layoutDensityId, layoutDensityContent,
        isBatchMode, batchOutputMode, specMode, pages, isAutoGeneratingPages,
        mediaAspectRatio, mediaResolution, mediaType,
        colorImage, referenceImages, copiedImageBase64,

        // Actions
        setPlatform: handlePlatformChange, setResolution, setCustomSize, setStyle, setCustomStyles,
        setDescription, setPageName, setKeywords, setEnableDesignTokens, setDesignTokens, setBackground,
        setHighQuality, setForceChinese,
        setPromptLanguage, setPreferredImageApiId,
        setDesignMdId, setDesignMdContent, setVisualStyleId, setVisualStyleContent, setLayoutDensityId, setLayoutDensityContent,
        setIsBatchMode, setBatchOutputMode, setSpecMode, setPages, setIsAutoGeneratingPages,
        setMediaAspectRatio: handleMediaAspectRatioChange, setMediaResolution, setMediaType,
        setColorImage, setReferenceImages, setCopiedImageBase64
    };
};
