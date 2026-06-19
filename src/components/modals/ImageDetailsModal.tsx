
import React, { useEffect, useState } from 'react';
import { GeneratedImage, LangType } from '../../types';
import { I18N } from '../../constants';
import { getAssetDetails } from '../../services/idbHistoryService';

interface Props {
    image: GeneratedImage | null;
    onClose: () => void;
    lang: LangType;
}

const ImageDetailsModal: React.FC<Props> = ({ image, onClose, lang }) => {
    const [displayImage, setDisplayImage] = useState<GeneratedImage | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!image) {
            setDisplayImage(null);
            return;
        }

        // Check if we need to lazy load
        // Simple check: prompt is 'Loading...' or details.isLazy is true
        const isLazy = image.prompt === 'Loading...' || (image.details as any)?.isLazy;

        if (isLazy) {
            setLoading(true);
            setDisplayImage(image); // Show placeholder initially
            getAssetDetails(image.id).then(fullAsset => {
                if (fullAsset) {
                    setDisplayImage(fullAsset);
                }
            }).finally(() => setLoading(false));
        } else {
            setDisplayImage(image);
            setLoading(false);
        }

    }, [image]);

    if (!displayImage) return null;
    const t = I18N[lang];
    const target = displayImage; // Use local state

    return (
        <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-0 sm:p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white dark:bg-stone-900 rounded-none sm:rounded-2xl w-full max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800">

                {/* Header */}
                <div className="flex justify-between items-center gap-3 p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
                    <h3 className="min-w-0 font-bold text-base sm:text-lg text-stone-800 dark:text-white flex flex-wrap items-center gap-2">
                        <span>🔍</span> {lang === 'zh' ? '生成详情' : 'Generation Details'}
                        {loading && <span className="text-xs text-stone-400 bg-stone-200 dark:bg-stone-800 px-2 py-0.5 rounded-full animate-pulse">{lang === 'zh' ? '加载中...' : 'Loading...'}</span>}
                    </h3>
                    <button onClick={onClose} className="min-h-10 min-w-10 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1">
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-auto flex flex-col md:flex-row">
                    {/* Left: Image Preview */}
                    <div className="flex-1 bg-stone-100 dark:bg-stone-950 p-3 sm:p-6 flex items-center justify-center min-h-[260px] sm:min-h-[300px]">
                        <img
                            src={target.url}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-lg border border-stone-200 dark:border-stone-800"
                            alt="Result"
                        />
                    </div>

                    {/* Right: Info */}
                    <div className="w-full md:w-96 p-4 sm:p-6 bg-white dark:bg-stone-900 border-t md:border-t-0 md:border-l border-stone-200 dark:border-stone-800 flex flex-col gap-6 overflow-y-auto">

                        {/* Meta */}
                        <div className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
                            <div className="flex justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                                <span>{t.platform}</span>
                                <span className="font-bold text-stone-800 dark:text-stone-200">{target.details?.platform || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                                <span>{t.resolution}</span>
                                <span className="font-bold text-stone-800 dark:text-stone-200">{target.details?.resolution || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                                <span>{t.designStyle}</span>
                                <span className="font-bold text-stone-800 dark:text-stone-200">
                                    {typeof target.details?.style === 'object'
                                        ? (target.details.style as any).name || (target.details.style as any).id
                                        : target.details?.style || '-'}
                                </span>
                            </div>
                        </div>

                        {/* Prompt */}
                        <div>
                            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{lang === 'zh' ? '完整提示词 (Prompt)' : 'Full Prompt'}</h4>
                            <div className="bg-stone-50 dark:bg-stone-950 p-3 rounded-lg border border-stone-200 dark:border-stone-800">
                                <p className="text-xs text-stone-600 dark:text-stone-400 font-mono whitespace-pre-wrap break-words leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                                    {loading ? (lang === 'zh' ? '正在加载提示词...' : 'Loading prompt...') : (target.details?.fullPrompt || target.prompt)}
                                </p>
                            </div>
                        </div>

                        {/* References */}
                        {target.details?.referenceImages && target.details.referenceImages.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{lang === 'zh' ? '参考图' : 'Reference Images'}</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {target.details.referenceImages.map((ref, idx) => (
                                        <div key={idx} className="flex flex-col gap-1 group">
                                            <div className="aspect-square rounded overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-950">
                                                <img src={ref.url} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-[9px] text-stone-400 truncate text-center">{ref.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageDetailsModal;
