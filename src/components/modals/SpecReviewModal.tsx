
import React from 'react';
import DesignSpecRenderer from '../DesignSpecRenderer';
import { GeneratedImage, LangType } from '../../types';
import { Badge, Button, DialogShell, Flex, TextFieldControl } from '../ui';

interface Props {
  specReviewImage: GeneratedImage | null;
  onClose: () => void;
  lang: LangType;
  specFeedback: string;
  setSpecFeedback: (s: string) => void;
  onRefine: () => void;
  onConfirm: () => void;
}

const SpecReviewModal: React.FC<Props> = ({ 
    specReviewImage, onClose, lang, specFeedback, setSpecFeedback, onRefine, onConfirm 
}) => {
  if (!specReviewImage) return null;

  return (
    <DialogShell
        open={!!specReviewImage}
        onOpenChange={(open) => { if (!open) onClose(); }}
        title={lang === 'zh' ? '审查设计规范' : 'Review Design Spec'}
        description={lang === 'zh' ? '确认设计规范后继续批量生成页面。' : 'Review the design spec before continuing to page generation.'}
        size="xl"
        closeLabel={lang === 'zh' ? '关闭设计规范审查' : 'Close design spec review'}
        footer={(
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                    <TextFieldControl
                        value={specFeedback}
                        onValueChange={setSpecFeedback}
                        placeholder={lang === 'zh' ? '输入反馈以修正规范 (例如: 颜色更暗一点)...' : 'Enter feedback to refine spec (e.g. Darker colors)...'}
                    />
                </div>
                <Button onClick={onRefine} variant="soft" color="gray">
                    {lang === 'zh' ? '修正规范' : 'Refine Spec'}
                </Button>
                <Button onClick={onConfirm} color="ruby" iconName="magic-wand">
                    {lang === 'zh' ? '确认并生成页面' : 'Approve & Generate Pages'}
                </Button>
            </div>
        )}
    >
            <Flex align="center" gap="2" mb="3">
                <Badge color="ruby" variant="soft">Step 1/2</Badge>
            </Flex>
            <div className="relative h-[calc(100dvh-290px)] min-h-[420px] overflow-hidden rounded-lg border border-[var(--gray-5)]">
                <div className="absolute inset-0 flex items-center justify-center overflow-auto bg-[var(--gray-2)] p-4">
                    {specReviewImage.details?.designSystem ? (
                            <div className="w-full min-h-full bg-white shadow-lg overflow-hidden">
                                <DesignSpecRenderer designSystem={specReviewImage.details.designSystem} lang={lang} />
                            </div>
                    ) : (
                            <img src={specReviewImage.url} className="max-w-full max-h-full object-contain shadow-lg" />
                    )}
                </div>
            </div>
    </DialogShell>
  );
};

export default SpecReviewModal;
