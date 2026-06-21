
import React, { useEffect, useState } from 'react';
import { GeneratedImage, LangType } from '../../types';
import { I18N } from '../../constants';
import { getAssetDetails } from '../../services/idbHistoryService';
import { Badge, Card, DialogShell, Flex, Text } from '../ui';

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
        <DialogShell
            open={!!displayImage}
            onOpenChange={(open) => { if (!open) onClose(); }}
            title={lang === 'zh' ? '生成详情' : 'Generation Details'}
            description={loading
                ? (lang === 'zh' ? '正在加载完整生成信息。' : 'Loading full generation details.')
                : (lang === 'zh' ? '查看生成参数、提示词和参考图。' : 'Inspect generation parameters, prompt and references.')}
            size="lg"
            closeLabel={lang === 'zh' ? '关闭生成详情' : 'Close generation details'}
        >
                {loading && (
                    <Flex mb="3">
                        <Badge color="gray" variant="soft">{lang === 'zh' ? '加载中...' : 'Loading...'}</Badge>
                    </Flex>
                )}
                <div className="flex min-h-[calc(100dvh-180px)] flex-col overflow-hidden md:min-h-[560px] md:flex-row">
                    {/* Left: Image Preview */}
                    <div className="flex min-h-[260px] flex-1 items-center justify-center bg-[var(--gray-2)] p-3 sm:min-h-[300px] sm:p-6">
                        <img
                            src={target.url}
                            className="max-h-full max-w-full rounded-lg border border-[var(--gray-5)] object-contain shadow-lg"
                            alt="Result"
                        />
                    </div>

                    {/* Right: Info */}
                    <div className="flex w-full flex-col gap-6 overflow-y-auto border-t border-[var(--gray-5)] bg-[var(--color-panel-solid)] p-4 md:w-96 md:border-l md:border-t-0 sm:p-6">

                        {/* Meta */}
                        <Card>
                            <div className="space-y-2 text-sm">
                            <div className="flex justify-between gap-4 border-b border-[var(--gray-4)] pb-2">
                                <Text color="gray">{t.platform}</Text>
                                <Text weight="bold" className="text-right">{target.details?.platform || '-'}</Text>
                            </div>
                            <div className="flex justify-between gap-4 border-b border-[var(--gray-4)] pb-2">
                                <Text color="gray">{t.resolution}</Text>
                                <Text weight="bold" className="text-right">{target.details?.resolution || '-'}</Text>
                            </div>
                            <div className="flex justify-between gap-4">
                                <Text color="gray">{t.designStyle}</Text>
                                <Text weight="bold" className="text-right">
                                    {typeof target.details?.style === 'object'
                                        ? (target.details.style as any).name || (target.details.style as any).id
                                        : target.details?.style || '-'}
                                </Text>
                            </div>
                            </div>
                        </Card>

                        {/* Prompt */}
                        <div>
                            <Text size="1" weight="bold" color="gray">{lang === 'zh' ? '完整提示词 (Prompt)' : 'Full Prompt'}</Text>
                            <Card className="mt-2">
                                <p className="max-h-48 overflow-y-auto break-words font-mono text-xs leading-relaxed text-[var(--gray-11)] whitespace-pre-wrap custom-scrollbar">
                                    {loading ? (lang === 'zh' ? '正在加载提示词...' : 'Loading prompt...') : (target.details?.fullPrompt || target.prompt)}
                                </p>
                            </Card>
                        </div>

                        {/* References */}
                        {target.details?.referenceImages && target.details.referenceImages.length > 0 && (
                            <div>
                                <Text size="1" weight="bold" color="gray">{lang === 'zh' ? '参考图' : 'Reference Images'}</Text>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {target.details.referenceImages.map((ref, idx) => (
                                        <div key={idx} className="flex flex-col gap-1 group">
                                            <div className="aspect-square overflow-hidden rounded border border-[var(--gray-5)] bg-[var(--gray-2)]">
                                                <img src={ref.url} alt={ref.label} className="w-full h-full object-cover" />
                                            </div>
                                            <Text size="1" color="gray" className="truncate text-center">{ref.label}</Text>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
        </DialogShell>
    );
};

export default ImageDetailsModal;
