import { GenerationConfig, PageRequest, UIStyle, DesignSystem } from "../types";
import { BUILDER_TOOLS, MEDIA_TYPES } from "../constants";
import { callTextAPI, callImageAPI } from './aiService';
import { Type } from "@google/genai";
import { createId } from '../utils/id';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const base64ToPart = (base64String: string) => {
    const mimeMatch = base64String.match(/^data:(.*?);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    const base64Data = base64String.replace(/^data:(.*?);base64,/, "");
    return { inlineData: { mimeType, data: base64Data } };
};

const processImageInput = async (input: string | undefined | null) => {
    if (!input) return null;
    if (input.startsWith('http://') || input.startsWith('https://')) {
        const res = await fetch(input);
        if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const base64Data = btoa(binary);
        const mimeType = res.headers.get('content-type') || 'image/png';
        return { inlineData: { mimeType, data: base64Data } };
    }
    return base64ToPart(input);
};

const getAspectRatio = (width: number, height: number): string => {
    const ratio = width / height;
    if (ratio >= 1.7) return '16:9';
    if (ratio >= 1.3) return '4:3';
    if (ratio >= 0.9) return '1:1';
    if (ratio >= 0.7) return '3:4';
    return '9:16';
};

// --- AI Functions ---

export const analyzeLayoutImage = async (base64Data: string, currentDescription: string): Promise<string> => {
    const prompt = `
Role: Expert UI/UX Designer.
Task: Analyze the visual layout structure from the image.
Output: Concise design specification.

Requirements:
1. **Layout Structure**: Grid/Flex strategy, main container alignment.
2. **Element Positions**: Key components and their placement (Header, Sidebar, Content).
3. **Arrangement**: Stacking order, alignment (Start/Center/Between), flow direction.
4. **Spacing & Sizing**: Estimated padding/margin standards (e.g., "Loose 24px", "Compact 8px").
5. **Remarks**: Special layout notes or responsive constraints.

Constraint: Use professional design terminology. Be brief.
Context: "${currentDescription}"
`;

    const { text } = await callTextAPI({ prompt, images: [base64Data] });
    return text || currentDescription;
};

export const extractStyleFromImages = async (files: File[]): Promise<UIStyle> => {
    const prompt = `Analyze these UI screenshots. Extract the visual design style. Return JSON object with name, description, promptModifier fields.`;

    const { text } = await callTextAPI({
        prompt,
        images: files,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                promptModifier: { type: Type.STRING }
            }
        }
    });

    const json = JSON.parse(text || "{}");
    return {
        id: `extracted-${Date.now()}`,
        category: 'Custom',
        name: json.name || 'Extracted',
        description: json.description,
        promptModifier: json.promptModifier,
        name_zh: json.name,
        description_zh: json.description
    };
};

export const generatePageList = async (appDescription: string, platform: string, lang: 'en' | 'zh'): Promise<PageRequest[]> => {
    const langInstruction = lang === 'zh' ? "Output Language: Simplified Chinese (简体中文) for Name and Description." : "Output Language: English.";
    const platformContext = platform === 'pc' ? "Desktop Application" : platform === 'web' ? "Web Interface" : "Mobile App";

    const prompt = `
    Role: Expert UI/UX Designer.
    Task: Breakdown the app description into 3-6 essential screens/pages.
    App Description: "${appDescription}"
    Platform: ${platformContext}
    ${langInstruction}

    Return a strict JSON array of objects with 'name' and 'description' keys.
    `;

    const { text } = await callTextAPI({
        prompt,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                }
            }
        }
    });

    const parsed = text.replace(/```json|```/g, '').trim();
    const pages = JSON.parse(parsed || "[]");
    return pages.map((p: any, idx: number) => ({ id: Date.now().toString() + idx, name: p.name, description: p.description }));
};

export const generateLayoutJson = async (userPrompt: string, contextDescription: string, width: number, height: number, modelName?: string): Promise<any[]> => {
    const grouped: Record<string, string[]> = {};
    BUILDER_TOOLS.forEach(t => {
        if (!grouped[t.category]) grouped[t.category] = [];
        grouped[t.category].push(`${t.id}(${t.defaultW}x${t.defaultH})`);
    });
    const toolsContext = Object.entries(grouped).map(([cat, tools]) => `- ${cat}: ${tools.join(', ')}`).join('\n');
    const safeW = width - 32;

    const prompt = `
    You are a Fast Layout Engine.
    **Task**: Generate a UI wireframe for screen: ${width}x${height}px.
    **Global Constants**: SCREEN_W = ${width}, SAFE_WIDTH = ${safeW}, PADDING = 16
    **Available Tools**:
    ${toolsContext}
    **Instructions**: "${userPrompt}"
    **Context**: "${contextDescription}"
    **RULES**:
    1. MAX 20 ELEMENTS.
    2. OUTPUT: CSV with Pipe (|). Header: typeId|x|y|w|h|label|note
    3. Block elements full width (x=16, w=${safeW}).
    4. Stacking: y = prev_y + prev_h + 20.
    DO NOT return JSON.
    `;

    const { text } = await callTextAPI({ prompt });
    const lines = (text || "").trim().split('\n');
    const elements: any[] = [];

    for (const line of lines) {
        if (!line.includes('|')) continue;
        const p = line.split('|').map(s => s.trim());
        if (p.length < 5) continue;
        const typeId = p[0];
        if (typeId.toLowerCase() === 'typeid') continue;
        const tool = BUILDER_TOOLS.find(t => t.id === typeId) || BUILDER_TOOLS[0];
        elements.push({
            typeId, x: parseInt(p[1]) || 0, y: parseInt(p[2]) || 0,
            w: parseInt(p[3]) || tool.defaultW, h: parseInt(p[4]) || tool.defaultH,
            label: p[5] || tool.label, note: p[6] || ''
        });
    }
    return elements;
};

export const generateDesignSpecJson = async (config: GenerationConfig, feedback?: string): Promise<DesignSystem> => {
    let tokenContext = "";
    if (config.enableDesignTokens && !config.designTokens.aiColor) {
        tokenContext = `
        **Mandatory Constraints**:
        - Primary Color: ${config.designTokens.primaryColor}
        - Background: ${config.designTokens.backgroundColor}
        - Accent: ${config.designTokens.accentColor}
        - Decorative: ${config.designTokens.decorativeColor}
        - Border Radius: ${config.designTokens.borderRadius}
        - Spacing Density: ${config.designTokens.spacing}
        Include these exact colors in the palette.
        `;
    }

    const prompt = `
    Create comprehensive UI Design System in strict JSON.
    App: ${config.description}
    Style: ${config.style.name}
    Platform: ${config.platform}
    ${tokenContext}
    ${feedback ? `Refinement Feedback: ${feedback}` : ''}
    Return JSON matching DesignSystem interface (palette, typography, measurements, styles, components).
    `;

    const { text } = await callTextAPI({
        prompt,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                palette: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, hex: { type: Type.STRING }, usage: { type: Type.STRING } } } },
                typography: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, size: { type: Type.STRING }, weight: { type: Type.STRING }, usage: { type: Type.STRING } } } },
                measurements: { type: Type.OBJECT, properties: { borderRadius: { type: Type.STRING }, spacingUnit: { type: Type.STRING }, gap: { type: Type.STRING } } },
                styles: { type: Type.OBJECT, properties: { gradient: { type: Type.STRING }, glassOpacity: { type: Type.NUMBER }, shadows: { type: Type.OBJECT, properties: { small: { type: Type.STRING }, medium: { type: Type.STRING }, large: { type: Type.STRING } } } } },
                globalStyleConstraint: { type: Type.STRING },
                components: { type: Type.OBJECT, properties: { buttonPrimary: { type: Type.OBJECT, properties: { bg: { type: Type.STRING }, text: { type: Type.STRING }, radius: { type: Type.STRING } } }, card: { type: Type.OBJECT, properties: { bg: { type: Type.STRING }, border: { type: Type.STRING }, radius: { type: Type.STRING } } } } }
            }
        }
    });

    return JSON.parse(text || "{}") as DesignSystem;
};

export const generatePageDescription = async (pageName: string, platform: string, lang: 'en' | 'zh'): Promise<string> => {
    const langInstruction = lang === 'zh' ? 'Output in Simplified Chinese (简体中文).' : 'Output in English.';
    const platformContext = platform === 'pc' ? 'Desktop Application' : platform === 'web' ? 'Web Interface' : 'Mobile App';

    const prompt = `You are a UI/UX designer. Given a page name and platform, write a concise functional description (2-3 sentences) of what this page should contain and its purpose.

Page Name: "${pageName}"
Platform: ${platformContext}
${langInstruction}`;

    const { text } = await callTextAPI({ prompt });
    return text || '';
};

export const optimizeDescription = async (description: string, platform: string, lang: 'en' | 'zh', context?: { activeRole?: string; skillMode?: boolean; skillType?: string }): Promise<string> => {
    const langInstruction = lang === 'zh' ? 'Output in Simplified Chinese (简体中文).' : 'Output in English.';
    const platformContext = platform === 'pc' ? 'Desktop Application' : platform === 'web' ? 'Web Interface' : 'Mobile App';

    let roleContext = 'You are a UI/UX designer.';
    let taskHint = 'Improve and expand the following design description to be more detailed, professional, and actionable for an AI image generation prompt. Keep it concise but rich in visual and functional details.';

    if (context?.activeRole === 'media') {
        roleContext = 'You are a creative media designer specializing in visual content creation.';
        taskHint = 'Improve and expand the following media design description. Focus on visual composition, color mood, typography, and artistic style. Make it detailed and actionable for AI image generation.';
    } else if (context?.activeRole === 'game') {
        roleContext = 'You are a game UI/UX designer specializing in game interfaces and HUD design.';
        taskHint = 'Improve and expand the following game UI description. Focus on game-specific elements like HUD, inventory, skill bars, health bars, minimap, and immersive visual style. Make it detailed and actionable for AI image generation.';
    } else if (context?.skillMode && context?.skillType) {
        const skillContextMap: Record<string, { role: string; hint: string }> = {
            'cover-image': {
                role: 'You are a cover image designer specializing in article/blog cover art.',
                hint: 'Improve this cover image description. Focus on visual impact, typography placement, color harmony, and the overall mood that draws readers in.',
            },
            'infographic': {
                role: 'You are an infographic designer specializing in data visualization and information design.',
                hint: 'Improve this infographic description. Focus on data layout, visual hierarchy, icon usage, section organization, and clarity of information flow.',
            },
            'xhs-images': {
                role: 'You are a social media content designer specializing in Xiaohongshu (小红书) style visual posts.',
                hint: 'Improve this XHS post description. Focus on trendy aesthetics, lifestyle appeal, text overlay style, and the visual storytelling that performs well on social platforms.',
            },
            'comic': {
                role: 'You are a comic/manga artist and storyboard designer.',
                hint: 'Improve this comic description. Focus on panel composition, character expressions, scene transitions, narrative pacing, and art style consistency.',
            },
            'article-illustrator': {
                role: 'You are an article illustrator specializing in editorial and explanatory visuals.',
                hint: 'Improve this illustration description. Focus on how the visual supports the article content, conceptual clarity, and aesthetic style that matches the editorial tone.',
            },
            'slide-deck': {
                role: 'You are a presentation designer specializing in slide deck visuals.',
                hint: 'Improve this slide deck description. Focus on slide layout, visual hierarchy, key message emphasis, consistent branding, and audience engagement.',
            },
            'logo': {
                role: 'You are a logo and brand identity designer.',
                hint: 'Improve this logo description. Focus on brand personality, symbol meaning, typography choice, scalability, and visual distinctiveness.',
            },
        };
        const ctx = skillContextMap[context.skillType];
        if (ctx) { roleContext = ctx.role; taskHint = ctx.hint; }
    }

    const prompt = `${roleContext} ${taskHint} Return only the improved description, no extra commentary.

Current Description: "${description}"
Platform: ${platformContext}
${langInstruction}`;

    const { text } = await callTextAPI({ prompt });
    return text || description;
};

export interface GenerateUIParams {
    prompt: string;
    config: GenerationConfig;
    colorImage?: File;
    styleImage?: File;
    contentImages?: File[];
    colorImageBase64?: string;
    styleImageBase64?: string;
    editImageBase64?: string;
    maskImageBase64?: string;
    layoutImageBase64?: string | null;
    preferredImageApiId?: string | null;
}

export const generateUIReference = async (params: GenerateUIParams): Promise<any> => {
    let finalPrompt = params.prompt;
    if (!finalPrompt || finalPrompt.trim() === "") {
        finalPrompt = constructPrompt(params.config, !!params.editImageBase64, !!params.layoutImageBase64);
    }

    if (params.maskImageBase64 && params.editImageBase64) {
        finalPrompt = `**REPAINT INSTRUCTION**: ${params.config.description || "Regenerate this area seamlessly."}\n\n${finalPrompt}`;
    }

    // Prepare base64 from File objects
    let colorB64 = params.colorImageBase64;
    let styleB64 = params.styleImageBase64;
    let contentB64s: string[] | undefined;

    if (params.colorImage) colorB64 = await fileToBase64(params.colorImage);
    if (params.styleImage) styleB64 = await fileToBase64(params.styleImage);
    if (params.contentImages?.length) contentB64s = await Promise.all(params.contentImages.map(fileToBase64));

    const width = params.config.customSize.active ? params.config.customSize.width : params.config.resolution.width;
    const height = params.config.customSize.active ? params.config.customSize.height : params.config.resolution.height;
    const aspectRatio = getAspectRatio(width, height);

    const { url } = await callImageAPI({
        prompt: finalPrompt,
        aspectRatio,
        preferredApiId: params.preferredImageApiId || undefined,
        images: {
            colorImageBase64: colorB64,
            styleImageBase64: styleB64,
            layoutImageBase64: params.layoutImageBase64,
            editImageBase64: params.editImageBase64,
            maskImageBase64: params.maskImageBase64,
            contentImageBase64s: contentB64s,
        }
    });

    const id = createId('image');
    return {
        id, url, base64: url,
        prompt: params.prompt, timestamp: Date.now(),
        details: {
            platform: params.config.platform,
            resolution: `${params.config.resolution.width}x${params.config.resolution.height}`,
            style: params.config.style.name,
            tokens: params.config.designTokens,
            fullPrompt: finalPrompt,
        }
    };
};

export const constructPrompt = (config: GenerationConfig, hasEditImage: boolean, hasLayoutImage: boolean, hasSpecReference: boolean = false, designSystemJson?: DesignSystem): string => {
    // Free mode: pass through user description as-is, no additions
    if (config.activeRole === 'free') {
        return config.description;
    }

    const width = config.customSize.active ? config.customSize.width : config.resolution.width;
    const height = config.customSize.active ? config.customSize.height : config.resolution.height;

    const isMediaMode = config.activeRole === 'media';

    let casingInstruction = `**CRITICAL**: Generate FLAT, EDGE-TO-EDGE ${isMediaMode ? 'IMAGE' : 'UI'}. No bezels/frames. ${width}x${height}px.`;
    let platformHint = '';

    if (isMediaMode) {
        platformHint = `${config.mediaAspectRatio || '3:4'} Aspect Ratio Media`;
    } else {
        platformHint = config.platform === 'mobile' ? "Mobile App" : config.platform === 'pc' ? "Desktop App" : "Web Interface";
    }

    let mediaTypeInstruction = "";
    if (isMediaMode && config.mediaType) {
        const mediaTypeObj = MEDIA_TYPES.find(t => t.id === config.mediaType);
        if (mediaTypeObj) {
            mediaTypeInstruction = `**MEDIA TYPE**: ${mediaTypeObj.promptDesc}`;
        }
    }

    let tokenPrompt = "";
    if (config.enableDesignTokens && !isMediaMode) {
        if (config.designTokens.aiColor) {
            tokenPrompt = `**DESIGN TOKENS**: Radius: ${config.designTokens.borderRadius}, Spacing: ${config.designTokens.spacing}. **COLORS**: AI Should automatically generate a harmonious color palette that fits the description perfectly.`;
        } else {
            tokenPrompt = `**DESIGN TOKENS**: Primary: ${config.designTokens.primaryColor}, Bg: ${config.designTokens.backgroundColor}, Accent: ${config.designTokens.accentColor}... Radius: ${config.designTokens.borderRadius}`;
        }
    }

    let layoutInstruction = "";
    if (hasLayoutImage) {
        layoutInstruction = `*** LAYOUT SKELETON ***: Use the provided 'Layout Structure' image as a WIREFRAME guide. Position elements exactly as shown.`;
    }

    let specInstruction = "";
    if (designSystemJson) {
        specInstruction = `
      **STRICT DESIGN SYSTEM SPECIFICATION**:
      Adhere to the following design system JSON for all colors, typography, and component styles:
      ${JSON.stringify(designSystemJson)}
      - **Global Constraint**: ${designSystemJson.globalStyleConstraint}
      - **Colors**: Use only the palette defined.
      - **Typography**: Match the font weights and sizing usage.
      - **Components**: Style buttons and cards EXACTLY as defined in the system.
      `;
    }

    let designMdInstruction = "";
    if (config.designMd && !isMediaMode) {
        designMdInstruction = `
**DESIGN SYSTEM REFERENCE (DESIGN.md)**:
Follow this design system strictly for all visual decisions — colors, typography, spacing, components, depth, and constraints.
---
${config.designMd}
---`;
    }

    let visualStyleInstruction = "";
    if (config.visualStyle) {
        visualStyleInstruction = `
**VISUAL STYLE REFERENCE**:
Apply the following visual style aesthetic to ALL generated ${isMediaMode ? 'media' : 'UI'} elements. This defines the overall mood, artistic treatment, color palette character, and visual texture.
---
${config.visualStyle}
---`;
    }

    let layoutDensityInstruction = "";
    if (config.layoutDensity && !isMediaMode) {
        layoutDensityInstruction = `
**LAYOUT DENSITY STRATEGY**:
Apply the following layout and information density rules to structure the UI elements. This controls spacing, element count per screen, grid strategy, and visual hierarchy.
---
${config.layoutDensity}
---`;
    }

    let languageInstruction = "";
    if (config.promptLanguage) {
        const langMap: Record<string, string> = {
            'zh': 'SIMPLIFIED CHINESE (简体中文)',
            'en': 'ENGLISH',
            'ja': 'JAPANESE (日本語)',
            'ko': 'KOREAN (한국어)',
            'fr': 'FRENCH (Français)',
            'de': 'GERMAN (Deutsch)',
            'es': 'SPANISH (Español)',
        };
        const langName = langMap[config.promptLanguage] || config.promptLanguage.toUpperCase();
        languageInstruction = `**TEXT LANGUAGE**: MUST USE ${langName} for all visible UI text, labels, and content.`;
    } else if (config.forceChinese) {
        languageInstruction = `**TEXT LANGUAGE**: MUST USE SIMPLIFIED CHINESE (简体中文) for all visible UI text, labels, and content.`;
    }

    let basePrompt = `**TASK**: Generate ${config.style.name} ${platformHint} for ${config.pageName}.
  **SPECS**: ${isMediaMode ? `Aspect Ratio ${config.mediaAspectRatio}` : config.platform} (${width}x${height}).
  **DESC**: ${config.description}
  **COMPONENTS**: ${config.keywords.join(', ')}
  ${casingInstruction}
  ${mediaTypeInstruction}
  ${tokenPrompt}
  ${layoutInstruction}
  ${specInstruction}
  ${designMdInstruction}
  ${visualStyleInstruction}
  ${layoutDensityInstruction}
  ${languageInstruction}
  **QUALITY**: Production-ready, pixel-perfect.`;

    if (isMediaMode) {
        const deviceTerms = ['mobile', 'tablet', 'desktop', 'browser', 'phone', '手机', '平板', '桌面端', '浏览器'];
        deviceTerms.forEach(term => {
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            basePrompt = basePrompt.replace(regex, '');
        });
        basePrompt = basePrompt.replace(/\s+/g, ' ').trim();
    }

    return basePrompt;
};

export const generateDesignSpec = async (config: GenerationConfig, feedback?: string): Promise<string> => { return ""; };
