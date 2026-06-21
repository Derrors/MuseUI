
import React from 'react';
import { GenerationConfig } from '../../types';
import { Badge, Button, Card, DialogShell, Flex, Text } from '../ui';

interface Props {
  reviewData: {
      prompt: string;
      config: GenerationConfig;
      pendingAction: () => void;
      images: { label: string, url: string }[];
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
  } | null;
  onClose: () => void;
}

const DevReviewModal: React.FC<Props> = ({ reviewData, onClose }) => {
  if (!reviewData) return null;

  const { apiRequestInfo } = reviewData;

  return (
    <DialogShell
        open={!!reviewData}
        onOpenChange={(open) => { if (!open) onClose(); }}
        title={reviewData.layoutAnalysis ? 'Layout Confirmation' : 'Review Generation Request'}
        description="Inspect the prompt, references and API target before running the request."
        size="lg"
        closeLabel="Close request review"
        footer={(
            <>
                <Button onClick={onClose} variant="soft" color="gray">Cancel</Button>
                <Button onClick={reviewData.pendingAction} color="ruby" iconName="magic-wand">
                    {reviewData.layoutAnalysis ? 'Confirm & Generate' : 'Generate'}
                </Button>
            </>
        )}
    >
            <div className="space-y-4">
                {reviewData.layoutAnalysis && (
                    <Card>
                        <Flex align="center" gap="2" mb="2">
                            <Badge color="ruby" variant="soft">Layout</Badge>
                            <Text size="1" weight="bold" color="gray">AI Analyzed Layout Structure</Text>
                        </Flex>
                        <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--gray-11)]">
                            {reviewData.layoutAnalysis}
                        </p>
                        <Text as="p" size="1" color="gray" mt="2">
                            This description will be used to generate the UI instead of the raw wireframe image to avoid visual artifacts.
                        </Text>
                    </Card>
                )}

                {/* API Request Info */}
                {apiRequestInfo && (
                    <Card>
                        <Flex align="center" gap="2" mb="3">
                            <Badge color="amber" variant="soft">API</Badge>
                            <Text size="1" weight="bold" color="gray">API Request Preview</Text>
                        </Flex>
                        <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className="rounded border border-[var(--amber-5)] bg-[var(--color-panel-solid)] p-2">
                                    <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase">Provider</span>
                                    <span className="font-mono text-stone-700 dark:text-stone-300">{apiRequestInfo.targetAPI.provider}</span>
                                </div>
                                <div className="rounded border border-[var(--amber-5)] bg-[var(--color-panel-solid)] p-2">
                                    <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase">Model</span>
                                    <span className="font-mono text-stone-700 dark:text-stone-300">{apiRequestInfo.targetAPI.model}</span>
                                </div>
                                <div className="rounded border border-[var(--amber-5)] bg-[var(--color-panel-solid)] p-2 sm:col-span-2">
                                    <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase">Base URL</span>
                                    <span className="font-mono text-stone-700 dark:text-stone-300 text-[11px] break-all">{apiRequestInfo.targetAPI.baseUrl}</span>
                                </div>
                                <div className="rounded border border-[var(--amber-5)] bg-[var(--color-panel-solid)] p-2">
                                    <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase">Aspect Ratio</span>
                                    <span className="font-mono text-stone-700 dark:text-stone-300">{apiRequestInfo.requestParams.aspectRatio}</span>
                                </div>
                                {apiRequestInfo.requestParams.preferredApiId && (
                                    <div className="rounded border border-[var(--amber-5)] bg-[var(--color-panel-solid)] p-2">
                                        <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase">Preferred API ID</span>
                                        <span className="font-mono text-stone-700 dark:text-stone-300">{apiRequestInfo.requestParams.preferredApiId}</span>
                                    </div>
                                )}
                            </div>
                            <div className="rounded border border-[var(--amber-5)] bg-[var(--color-panel-solid)] p-2">
                                <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase mb-1">Images</span>
                                <div className="flex flex-wrap gap-1">
                                    {apiRequestInfo.requestParams.images.hasColorImage && (
                                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] rounded-full">Color</span>
                                    )}
                                    {apiRequestInfo.requestParams.images.hasStyleImage && (
                                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] rounded-full">Style</span>
                                    )}
                                    {apiRequestInfo.requestParams.images.hasLayoutImage && (
                                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[10px] rounded-full">Layout</span>
                                    )}
                                    {apiRequestInfo.requestParams.images.hasEditImage && (
                                        <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] rounded-full">Edit</span>
                                    )}
                                    {apiRequestInfo.requestParams.images.hasMaskImage && (
                                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] rounded-full">Mask</span>
                                    )}
                                    {apiRequestInfo.requestParams.images.contentImageCount > 0 && (
                                        <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-[10px] rounded-full">Content x{apiRequestInfo.requestParams.images.contentImageCount}</span>
                                    )}
                                    {!apiRequestInfo.requestParams.images.hasColorImage &&
                                     !apiRequestInfo.requestParams.images.hasStyleImage &&
                                     !apiRequestInfo.requestParams.images.hasLayoutImage &&
                                     !apiRequestInfo.requestParams.images.hasEditImage &&
                                     !apiRequestInfo.requestParams.images.hasMaskImage &&
                                     apiRequestInfo.requestParams.images.contentImageCount === 0 && (
                                        <span className="text-stone-400 dark:text-stone-500 text-[10px]">No reference images</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                <div>
                    <Text size="1" weight="bold" color="gray">Final Prompt Preview</Text>
                    <Card className="mt-1">
                        <p className="max-h-48 overflow-y-auto whitespace-pre-wrap font-mono text-xs text-[var(--gray-11)]">{reviewData.prompt}</p>
                    </Card>
                </div>

                {reviewData.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {reviewData.images.map((img, idx) => (
                            <div key={idx} className="text-center group relative">
                                <img src={img.url} alt={img.label} className="h-16 w-full object-contain mx-auto border rounded bg-stone-50 dark:bg-stone-800" />
                                <span className="text-[9px] text-stone-500 block mt-1 truncate px-1">{img.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
    </DialogShell>
  );
};

export default DevReviewModal;
