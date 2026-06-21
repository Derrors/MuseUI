import { APIConfig, RequestLogEntry } from '../types';
import { addRequestLog, DEFAULT_IMAGE_MODEL, DEFAULT_TEXT_MODEL, getEnabledImageAPIs, getEnabledTextAPIs } from './apiKeyStore';
import { buildOpenAICompatibleRequestUrl, buildRequestUrl } from './apiUrl';
import { createId } from '../utils/id';

// ─── Helpers ───

const now = () => Date.now();

const logRequest = (entry: Omit<RequestLogEntry, 'id' | 'timestamp'>) => {
    addRequestLog({ id: createId('request'), timestamp: now(), ...entry });
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// ─── Text API Implementations ───

interface TextAPIOptions {
    prompt: string;
    images?: (string | File)[];
    responseSchema?: any;
    responseMimeType?: string;
}

const isChatCompletionsEndpoint = (baseUrl: string): boolean => {
    const normalized = baseUrl.toLowerCase();
    return normalized.includes('chat.completions') || normalized.includes('chat/completions');
};

export const shouldFallbackToChatImageAPI = (error: unknown): boolean => {
    const message = error instanceof Error ? error.message : String(error);
    return /messages is required|chat.?completions|unsupported.*images|images.*unsupported|unsupported.*edits|edits.*unsupported|image.?edits|OpenAI image edit error (404|405|501)|no available compatible accounts|no compatible accounts|compatible accounts/i.test(message);
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

    const res = await fetch(buildOpenAICompatibleRequestUrl(api.baseUrl, 'chat/completions'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${api.apiKey}`,
        },
        body: JSON.stringify({
            model: api.textModel || DEFAULT_TEXT_MODEL,
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
    const enabled = getEnabledTextAPIs();
    if (enabled.length === 0) throw new Error('NO_TEXT_API_CONFIGURED');

    let lastError: Error | null = null;

    for (const api of enabled) {
        const start = now();
        try {
            const text = await callOpenAITextAPI(api, opts);
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

type ImageInputKind = 'edit' | 'color' | 'style' | 'layout' | 'content' | 'mask';

const collectImageInputs = (images?: ImageAPIOptions['images'], includeMask = false): { kind: ImageInputKind; value: string }[] => {
    if (!images) return [];
    const inputs: { kind: ImageInputKind; value: string }[] = [];
    const push = (kind: ImageInputKind, value?: string | null) => {
        if (value) inputs.push({ kind, value });
    };

    push('edit', images.editImageBase64);
    push('color', images.colorImageBase64);
    push('style', images.styleImageBase64);
    push('layout', images.layoutImageBase64 || undefined);
    images.contentImageBase64s?.forEach(value => push('content', value));
    if (includeMask) push('mask', images.maskImageBase64);
    return inputs;
};

const hasEditableImageInputs = (images?: ImageAPIOptions['images']): boolean => (
    collectImageInputs(images).length > 0
);

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

const dataUrlToBlob = (dataUrl: string): Blob => {
    const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
    if (!match) {
        const bytes = Uint8Array.from(atob(dataUrl), char => char.charCodeAt(0));
        return new Blob([bytes], { type: 'image/png' });
    }

    const [, mimeType, base64Data] = match;
    const bytes = Uint8Array.from(atob(base64Data), char => char.charCodeAt(0));
    return new Blob([bytes], { type: mimeType || 'image/png' });
};

const imageSourceToBlob = async (source: string): Promise<Blob> => {
    if (source.startsWith('http://') || source.startsWith('https://')) {
        const res = await fetch(buildRequestUrl(source));
        if (!res.ok) throw new Error(`Failed to fetch image input: ${res.status}`);
        return res.blob();
    }
    return dataUrlToBlob(source);
};

const blobToDataUrl = (blob: Blob): Promise<string> => (
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    })
);

const readImageResponse = async (data: any): Promise<string> => {
    const b64Json = data.data?.[0]?.b64_json;
    if (b64Json) return `data:image/png;base64,${b64Json}`;

    const imageUrl = data.data?.[0]?.url;
    if (!imageUrl) throw new Error('No image URL returned from OpenAI');

    const imgRes = await fetch(buildRequestUrl(imageUrl));
    if (!imgRes.ok) throw new Error(`Failed to fetch generated image: ${imgRes.status}`);
    return blobToDataUrl(await imgRes.blob());
};

export async function callOpenAIImageAPI(api: APIConfig, opts: ImageAPIOptions): Promise<string> {
    const res = await fetch(buildOpenAICompatibleRequestUrl(api.baseUrl, 'images/generations'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${api.apiKey}`,
        },
        body: JSON.stringify({
            model: api.imageModel || DEFAULT_IMAGE_MODEL,
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
    return readImageResponse(data);
}

export async function callOpenAIImageEditAPI(api: APIConfig, opts: ImageAPIOptions): Promise<string> {
    const imageInputs = collectImageInputs(opts.images);
    if (imageInputs.length === 0) {
        return callOpenAIImageAPI(api, opts);
    }

    const form = new FormData();
    form.append('model', api.imageModel || DEFAULT_IMAGE_MODEL);
    form.append('prompt', opts.prompt);
    form.append('size', aspectToSize(opts.aspectRatio));
    form.append('n', '1');

    for (const [index, input] of imageInputs.entries()) {
        const blob = await imageSourceToBlob(input.value);
        form.append('image', blob, `${input.kind}-${index + 1}.png`);
    }

    if (opts.images?.maskImageBase64) {
        const maskBlob = await imageSourceToBlob(opts.images.maskImageBase64);
        form.append('mask', maskBlob, 'mask.png');
    }

    const res = await fetch(buildOpenAICompatibleRequestUrl(api.baseUrl, 'images/edits'), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${api.apiKey}`,
        },
        body: form,
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI image edit error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return readImageResponse(data);
}

// OpenAI-compatible chat-based image generation (some proxies only support chat.completions for images)
export async function callOpenAIChatImageAPI(api: APIConfig, opts: ImageAPIOptions): Promise<string> {
    const promptImages = collectImageInputs(opts.images);
    const messages: any[] = promptImages.length > 0
        ? [{
            role: 'user',
            content: [
                { type: 'text', text: opts.prompt },
                ...promptImages.map(input => ({
                    type: 'image_url',
                    image_url: { url: input.value },
                })),
            ],
        }]
        : [{ role: 'user', content: opts.prompt }];

    const res = await fetch(buildOpenAICompatibleRequestUrl(api.baseUrl, 'chat/completions'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${api.apiKey}`,
        },
        body: JSON.stringify({
            model: api.imageModel || DEFAULT_IMAGE_MODEL,
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
        const imgRes = await fetch(buildRequestUrl(imageUrl));
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
        const imgRes = await fetch(buildRequestUrl(imageUrl));
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
    let enabled = getEnabledImageAPIs();
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
            if (api.imageMode === 'chat' || (api.imageMode !== 'images' && isChatCompletionsEndpoint(api.baseUrl))) {
                url = await callOpenAIChatImageAPI(api, opts);
            } else {
                try {
                    url = hasEditableImageInputs(opts.images)
                        ? await callOpenAIImageEditAPI(api, opts)
                        : await callOpenAIImageAPI(api, opts);
                } catch (e: any) {
                    if (api.imageMode !== 'images' && shouldFallbackToChatImageAPI(e)) {
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
