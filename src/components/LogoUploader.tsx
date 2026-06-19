
import React, { useRef } from 'react';
import IconLoader from './IconLoader';
import { I18N } from '../constants';
import { LangType } from '../types';

interface Props {
    logoUrl?: string;
    onChange: (base64: string | undefined) => void;
    lang: LangType;
}

const LogoUploader: React.FC<Props> = ({ logoUrl, onChange, lang }) => {
    const t = I18N[lang];
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            onChange(base64);
        };
        reader.readAsDataURL(file);
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(undefined);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                {lang === 'zh' ? '品牌 Logo' : 'Brand Logo'}
            </label>
            
            <div 
                onClick={() => fileInputRef.current?.click()}
                className={`
                    group relative w-24 h-24 rounded-xl border-2 border-dashed 
                    flex items-center justify-center cursor-pointer transition-all overflow-hidden
                    ${logoUrl 
                        ? 'border-teal-200 dark:border-teal-800 bg-white dark:bg-black' 
                        : 'border-stone-300 dark:border-stone-600 hover:border-teal-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }
                `}
            >
                {logoUrl ? (
                    <>
                        <img src={logoUrl} alt="Brand Logo" className="w-full h-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity animate-in fade-in duration-200">
                                <button 
                                    onClick={handleRemove}
                                    className="min-h-10 min-w-10 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center"
                                    title={lang === 'zh' ? '移除' : 'Remove'}
                                >
                                    <IconLoader name="trash" size={16} />
                                </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-1 text-stone-400">
                        <IconLoader name="upload" size={20} />
                        <span className="text-[10px]">{lang === 'zh' ? '上传' : 'Upload'}</span>
                    </div>
                )}
                
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                />
            </div>
            <p className="text-xs text-stone-500">
                {lang === 'zh' 
                    ? 'Logo 将被用于生成结果的导航栏或启动页中。' 
                    : 'Logo will be integrated into headers or splash screens.'
                }
            </p>
        </div>
    );
};

export default LogoUploader;
