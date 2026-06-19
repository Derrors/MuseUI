
import React from 'react';
import { GenerationConfig } from '../../types';

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
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-0 sm:p-4">
        <div className="bg-white dark:bg-stone-900 rounded-none sm:rounded-xl p-4 sm:p-6 max-w-3xl w-full h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-bold mb-4 text-stone-800 dark:text-white">
                {reviewData.layoutAnalysis ? 'Layout Confirmation' : 'Review Generation Request'}
            </h3>
            <div className="space-y-4 flex-1 overflow-y-auto mb-4 custom-scrollbar p-1">
                {reviewData.layoutAnalysis && (
                    <div className="bg-teal-50 dark:bg-teal-900/20 border-l-4 border-teal-500 p-4 rounded-r">
                        <label className="text-xs font-bold text-teal-600 dark:text-teal-400 block mb-2 uppercase tracking-wide">
                            AI Analyzed Layout Structure
                        </label>
                        <p className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                            {reviewData.layoutAnalysis}
                        </p>
                        <p className="text-[10px] text-stone-500 mt-2 italic">
                            This description will be used to generate the UI instead of the raw wireframe image to avoid visual artifacts.
                        </p>
                    </div>
                )}

                {/* API Request Info */}
                {apiRequestInfo && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r">
                        <label className="text-xs font-bold text-amber-600 dark:text-amber-400 block mb-2 uppercase tracking-wide">
                            API Request Preview
                        </label>
                        <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className="bg-white dark:bg-stone-800 p-2 rounded border border-amber-200 dark:border-amber-800">
                                    <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase">Provider</span>
                                    <span className="font-mono text-stone-700 dark:text-stone-300">{apiRequestInfo.targetAPI.provider}</span>
                                </div>
                                <div className="bg-white dark:bg-stone-800 p-2 rounded border border-amber-200 dark:border-amber-800">
                                    <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase">Model</span>
                                    <span className="font-mono text-stone-700 dark:text-stone-300">{apiRequestInfo.targetAPI.model}</span>
                                </div>
                                <div className="bg-white dark:bg-stone-800 p-2 rounded border border-amber-200 dark:border-amber-800 sm:col-span-2">
                                    <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase">Base URL</span>
                                    <span className="font-mono text-stone-700 dark:text-stone-300 text-[11px] break-all">{apiRequestInfo.targetAPI.baseUrl}</span>
                                </div>
                                <div className="bg-white dark:bg-stone-800 p-2 rounded border border-amber-200 dark:border-amber-800">
                                    <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase">Aspect Ratio</span>
                                    <span className="font-mono text-stone-700 dark:text-stone-300">{apiRequestInfo.requestParams.aspectRatio}</span>
                                </div>
                                {apiRequestInfo.requestParams.preferredApiId && (
                                    <div className="bg-white dark:bg-stone-800 p-2 rounded border border-amber-200 dark:border-amber-800">
                                        <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase">Preferred API ID</span>
                                        <span className="font-mono text-stone-700 dark:text-stone-300">{apiRequestInfo.requestParams.preferredApiId}</span>
                                    </div>
                                )}
                            </div>
                            <div className="bg-white dark:bg-stone-800 p-2 rounded border border-amber-200 dark:border-amber-800">
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
                    </div>
                )}

                <div>
                    <label className="text-xs font-bold text-stone-500 block mb-1">Final Prompt Preview</label>
                    <p className="text-sm text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 p-2 rounded whitespace-pre-wrap font-mono text-xs max-h-40 overflow-y-auto">{reviewData.prompt}</p>
                </div>

                {reviewData.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {reviewData.images.map((img, idx) => (
                            <div key={idx} className="text-center group relative">
                                <img src={img.url} className="h-16 w-full object-contain mx-auto border rounded bg-stone-50 dark:bg-stone-800" />
                                <span className="text-[9px] text-stone-500 block mt-1 truncate px-1">{img.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button onClick={onClose} className="min-h-11 px-4 py-2 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 text-sm">Cancel</button>
                <button
                    onClick={reviewData.pendingAction}
                    className="min-h-11 px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded font-bold hover:from-teal-500 hover:to-cyan-500 shadow-lg text-sm"
                >
                    {reviewData.layoutAnalysis ? 'Confirm & Generate' : 'Generate'}
                </button>
            </div>
        </div>
    </div>
  );
};

export default DevReviewModal;
