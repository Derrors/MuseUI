import { GoogleGenAI } from '@google/genai';
import { APIConfig, AIProvider, RequestLogEntry } from '../types';
import { getAPISettings, addRequestLog } from './apiKeyStore';
import { createId } from '../utils/id';

// ─── Helpers ───

const now = () => Date.now();

const logRequest = (entry: Omit<RequestLogEntry, 'id' | 'timestamp'>) => {
    addRequestLog({ id: createId('request'), timestamp: now(), ...entry });
};

const base64ToPart = (base64String: string) => {
    const mimeMatch = base64String.match(/^data:(.*?);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    const base64Data = base64String.replace(/^data:(.*?);base64,/, '');
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

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// ─── Gemini SDK Clients (cached) ───
const clientCache = new Map<string, GoogleGenAI>();

const getGeminiClient = (apiConfig: APIConfig): GoogleGenAI => {
    const key = `${apiConfig.provider}-${apiConfig.baseUrl}-${apiConfig.apiKey}`;
    if (!clientCache.has(key)) {
        const opts: any = { apiKey: apiConfig.apiKey };
        if (apiConfig.baseUrl.trim()) opts.httpOptions = { baseUrl: apiConfig.baseUrl.trim() };
        clientCache.set(key, new GoogleGenAI(opts));
    }
    return clientCache.get(key)!;
};

// ─── Text API Implementations ───

interface TextAPIOptions {
    prompt: string;
    images?: (string | File)[];
    responseSchema?: any;
    responseMimeType?: string;
}

export async function callGeminiTextAPI(api: APIConfig, opts: TextAPIOptions): Promise<string> {
    const ai = getGeminiClient(api);
    const parts: any[] = [{ text: opts.prompt }];

    if (opts.images) {
        for (const img of opts.images) {
            const input = typeof img === 'string' ? img : await fileToBase64(img);
            const p = await processImageInput(input);
            if (p) parts.push(p);
        }
    }

    const config: any = {};
    if (opts.responseMimeType) config.responseMimeType = opts.responseMimeType;
    if (opts.responseSchema) config.responseSchema = opts.responseSchema;

    const response = await ai.models.generateContent({
        model: api.textModel || 'gemini-2.5-flash',
        contents: { parts },
        config,
    });

    return response.text?.trim() || '';
}

const isChatCompletionsEndpoint = (baseUrl: string): boolean => {
    const normalized = baseUrl.toLowerCase();
    return normalized.includes('chat.completions') || normalized.includes('chat/completions');
};

export async function callOpenAITextAPI(api: APIConfig, opts: TextAPIOptions): Promise<string> {
    const messages: any[] = [];

    if (opts.images && opts.images.length > 0) {
        const content: any[] = [{ type: 'text', text: opts.prompt }];
        for (const img of opts.images) {
            const url = typeof img === 'string' ? img : await fileToBase64(img);
            content.push({ type: 'image_url', image_url: { url } });
        }
        messages.push({ role: 'user', content });
    } else {
        messages.push({ role: 'user', content: opts.prompt });
    }

    const res = await fetch(api.baseUrl.trim(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${api.apiKey}`,
        },
        body: JSON.stringify({
            model: api.textModel || 'gpt-4o',
            messages,
            ...(opts.responseSchema || opts.responseMimeType === 'application/json'
                ? { response_format: { type: 'json_object' } }
                : {}),
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
}

export async function callTextAPI(opts: TextAPIOptions): Promise<{ text: string; usedAPI: APIConfig }> {
    const settings = getAPISettings();
    const enabled = settings.textAPIs.filter(a => a.enabled);
    if (enabled.length === 0) throw new Error('NO_TEXT_API_CONFIGURED');

    let lastError: Error | null = null;

    for (const api of enabled) {
        const start = now();
        try {
            let text: string;
            if (api.provider === 'gemini') {
                text = await callGeminiTextAPI(api, opts);
            } else {
                text = await callOpenAITextAPI(api, opts);
            }
            logRequest({
                type: 'text',
                provider: api.provider,
                model: api.textModel || '',
                baseUrl: api.baseUrl,
                success: true,
                latencyMs: now() - start,
            });
            return { text, usedAPI: api };
        } catch (e: any) {
            lastError = e;
            logRequest({
                type: 'text',
                provider: api.provider,
                model: api.textModel || '',
                baseUrl: api.baseUrl,
                success: false,
                latencyMs: now() - start,
                error: e.message || String(e),
            });
        }
    }

    throw lastError || new Error('All text APIs failed');
}

// ─── Image API Implementations ───

interface ImageAPIOptions {
    prompt: string;
    aspectRatio?: string;
    preferredApiId?: string;
    images?: { colorImageBase64?: string; styleImageBase64?: string; layoutImageBase64?: string | null; editImageBase64?: string; maskImageBase64?: string; contentImageBase64s?: string[] };
}

const aspectToSize = (aspect?: string): string => {
    switch (aspect) {
        case '16:9': return '1792x1024';
        case '4:3': return '1024x1024';
        case '3:4': return '1024x1792';
        case '9:16': return '1024x1792';
        case '1:1': return '1024x1024';
        default: return '1024x1024';
    }
};

export async function callGeminiImageAPI(api: APIConfig, opts: ImageAPIOptions): Promise<string> {
    const ai = getGeminiClient(api);
    const parts: any[] = [{ text: opts.prompt }];

    if (opts.images) {
        const refs = [
            { key: opts.images.colorImageBase64, label: 'REFERENCE 1: COLOR PALETTE SOURCE.' },
            { key: opts.images.styleImageBase64, label: 'REFERENCE 2: VISUAL STYLE SOURCE.' },
            { key: opts.images.layoutImageBase64, label: 'REFERENCE 3: LAYOUT STRUCTURE.' },
            { key: opts.images.editImageBase64, label: '**INPUT IMAGE FOR EDITING**' },
            { key: opts.images.maskImageBase64, label: 'Reference Image: Inpainting Mask' },
        ];
        for (const ref of refs) {
            if (ref.key) {
                const p = await processImageInput(ref.key);
                if (p) { parts.push({ text: ref.label }); parts.push(p); }
            }
        }
        if (opts.images.contentImageBase64s) {
            parts.push({ text: 'Reference Images: Content Assets' });
            for (const img of opts.images.contentImageBase64s) {
                const p = await processImageInput(img);
                if (p) parts.push(p);
            }
        }
    }

    const generateConfig: any = { imageConfig: { aspectRatio: opts.aspectRatio || '1:1' } };
    if ((api.imageModel || '').includes('gemini-3-pro')) generateConfig.imageConfig.imageSize = '1K';

    const response = await ai.models.generateContent({
        model: api.imageModel || 'nado-banana-2',
        contents: { parts },
        config: generateConfig,
    });

    const finishReason = response.candidates?.[0]?.finishReason;

    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }

    if (finishReason === 'PROHIBITED_CONTENT' || finishReason === 'SAFETY') {
        throw new Error('内容被安全过滤器拦截。您的描述可能包含敏感内容，请尝试修改后重试。\nContent blocked by safety filters. Your description may contain sensitive content — please revise and try again.');
    }

    if (finishReason === 'RECITATION') {
        throw new Error('内容因版权保护被拦截，请尝试修改描述。\nContent blocked due to recitation policy. Please revise your description.');
    }

    const textContent = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textContent) throw new Error(`AI Refused: ${textContent}`);
    throw new Error(`No image generated. FinishReason: ${finishReason || 'UNKNOWN'}`);
}

export async function callOpenAIImageAPI(api: APIConfig, opts: ImageAPIOptions): Promise<string> {
    const res = await fetch(api.baseUrl.trim(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${api.apiKey}`,
        },
        body: JSON.stringify({
            model: api.imageModel || 'gpt-image-2',
            prompt: opts.prompt,
            size: aspectToSize(opts.aspectRatio),
            quality: 'standard',
            n: 1,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI image error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const imageUrl = data.data?.[0]?.url;
    if (!imageUrl) throw new Error('No image URL returned from OpenAI');

    // Fetch the image and convert to base64
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Failed to fetch generated image: ${imgRes.status}`);
    const blob = await imgRes.blob();
    const reader = new FileReader();
    const base64: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
    return base64;
}

// OpenAI-compatible chat-based image generation (some proxies only support chat.completions for images)
export async function callOpenAIChatImageAPI(api: APIConfig, opts: ImageAPIOptions): Promise<string> {
    const messages: any[] = [{ role: 'user', content: opts.prompt }];

    const res = await fetch(api.baseUrl.trim(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${api.apiKey}`,
        },
        body: JSON.stringify({
            model: api.imageModel || 'gpt-image-2',
            messages,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI chat image error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content returned from chat image API');

    // Try markdown image link: ![alt](url)
    const markdownMatch = content.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/);
    if (markdownMatch) {
        const imageUrl = markdownMatch[1];
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) throw new Error(`Failed to fetch generated image: ${imgRes.status}`);
        const blob = await imgRes.blob();
        const reader = new FileReader();
        const base64: string = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        return base64;
    }

    // Try base64 embedded in content
    const base64Match = content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
    if (base64Match) {
        return `data:image/png;base64,${base64Match[1]}`;
    }

    // Try plain URL
    const urlMatch = content.trim().match(/^(https?:\/\/\S+)$/);
    if (urlMatch) {
        const imageUrl = urlMatch[1];
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) throw new Error(`Failed to fetch generated image: ${imgRes.status}`);
        const blob = await imgRes.blob();
        const reader = new FileReader();
        const base64: string = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        return base64;
    }

    throw new Error(`Could not extract image from response: ${content.substring(0, 200)}`);
}

export async function callImageAPI(opts: ImageAPIOptions): Promise<{ url: string; usedAPI: APIConfig }> {
    const settings = getAPISettings();
    let enabled = settings.imageAPIs.filter(a => a.enabled);
    if (enabled.length === 0) throw new Error('NO_IMAGE_API_CONFIGURED');

    if (opts.preferredApiId) {
        const preferred = enabled.find(a => a.id === opts.preferredApiId);
        if (preferred) {
            enabled = [preferred];
        }
    }

    let lastError: Error | null = null;

    for (const api of enabled) {
        const start = now();
        try {
            let url: string;
            if (api.provider === 'gemini') {
                url = await callGeminiImageAPI(api, opts);
            } else if (isChatCompletionsEndpoint(api.baseUrl)) {
                // Proxy routes images through chat.completions (e.g. gpt-image-2 via chat)
                url = await callOpenAIChatImageAPI(api, opts);
            } else {
                // Standard images.generations; fallback to chat.completions if the proxy requires it
                try {
                    url = await callOpenAIImageAPI(api, opts);
                } catch (e: any) {
                    if (e.message?.includes('messages is required')) {
                        url = await callOpenAIChatImageAPI(api, opts);
                    } else {
                        throw e;
                    }
                }
            }
            logRequest({
                type: 'image',
                provider: api.provider,
                model: api.imageModel || '',
                baseUrl: api.baseUrl,
                success: true,
                latencyMs: now() - start,
            });
            return { url, usedAPI: api };
        } catch (e: any) {
            lastError = e;
            logRequest({
                type: 'image',
                provider: api.provider,
                model: api.imageModel || '',
                baseUrl: api.baseUrl,
                success: false,
                latencyMs: now() - start,
                error: e.message || String(e),
            });
        }
    }

    throw lastError || new Error('All image APIs failed');
}
