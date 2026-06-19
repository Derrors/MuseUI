import React, { useState, useRef, useEffect } from 'react';
import { I18N } from '../../constants';
import { LangType, Project } from '../../types';
import IconLoader from '../IconLoader';
import html2canvas from 'html2canvas';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    onSaveProject: (name: string, thumbnail?: string) => void;
    onCreateBlankProject: () => void;
    onUpdateProjectName: (id: string, name: string) => void;
    onUpdateProjectContent: (id: string, thumbnail?: string) => void;
    onLoadProject: (id: string) => void;
    onDeleteProject: (id: string) => void;
    currentProjectId: string | null;
    lang: LangType;
    onRequestConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const ProjectManagerModal: React.FC<Props> = ({
    isOpen, onClose, projects,
    onSaveProject, onCreateBlankProject, onUpdateProjectName, onUpdateProjectContent, onLoadProject, onDeleteProject,
    currentProjectId,
    lang,
    onRequestConfirm
}) => {
    const [newProjectName, setNewProjectName] = useState('');
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const t = I18N[lang];

    useEffect(() => {
        if (isOpen) {
            setNewProjectName(`Project ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString().slice(0, 5)} `);
            captureThumbnail();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const captureThumbnail = async () => {
        setIsCapturing(true);
        try {
            const canvasElement = document.getElementById('main-canvas-area');
            if (canvasElement) {
                const canvas = await html2canvas(canvasElement, {
                    useCORS: true,
                    scale: 0.2,
                    logging: false
                });
                setThumbnail(canvas.toDataURL('image/jpeg', 0.8));
            }
        } catch (e) {
            console.error("Screenshot failed", e);
        }
        setIsCapturing(false);
    };

    const handleSaveNew = () => {
        if (newProjectName.trim()) {
            onSaveProject(newProjectName, thumbnail || undefined);
            setNewProjectName('');
        }
    };

    const handleStartEdit = (p: Project) => {
        setEditingId(p.id);
        setEditName(p.name);
    };

    const handleConfirmEdit = () => {
        if (editingId && editName.trim()) {
            onUpdateProjectName(editingId, editName);
            setEditingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-white dark:bg-stone-800 rounded-none sm:rounded-xl shadow-2xl w-full sm:w-[600px] max-h-[100dvh] sm:max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-stone-200 dark:border-stone-700 flex justify-between items-center bg-stone-50 dark:bg-stone-900/50">
                    <h2 className="font-bold text-lg text-stone-800 dark:text-stone-100 flex items-center gap-2">
                        <IconLoader name="layout" />
                        {lang === 'zh' ? '项目管理' : 'Project Manager'}
                    </h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                        <IconLoader name="x" size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-stone-100 dark:bg-stone-900/20">

                    {/* New Project Input Section */}
                    <div className="bg-white dark:bg-stone-800 p-4 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 mb-6">
                        <h3 className="text-xs font-bold text-stone-500 uppercase mb-3 flex items-center gap-2">
                            <IconLoader name="plus" size={12} />
                            {lang === 'zh' ? '新建项目' : 'Create New Project'}
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                            <div className="w-16 h-16 bg-stone-200 dark:bg-stone-700 rounded-lg shrink-0 overflow-hidden border border-stone-300 dark:border-stone-600">
                                {thumbnail ? (
                                    <img src={thumbnail} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                                        <IconLoader name="loader" className="animate-spin" size={16} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-center gap-2">
                                <input
                                    type="text"
                                    className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 focus:ring-2 ring-teal-500"
                                    placeholder={lang === 'zh' ? '输入新项目名称...' : 'Enter new project name...'}
                                    value={newProjectName}
                                    onChange={e => setNewProjectName(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleSaveNew}
                                disabled={!newProjectName.trim()}
                                className="min-h-11 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-sm shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                            >
                                <IconLoader name="save" size={16} />
                                {lang === 'zh' ? '保存' : 'Save'}
                            </button>
                        </div>
                        <button
                            onClick={() => { onCreateBlankProject(); onClose(); }}
                            className="mt-3 w-full py-2 text-sm rounded-lg border-2 border-dashed border-stone-300 dark:border-stone-600 text-stone-500 dark:text-stone-400 hover:border-teal-400 hover:text-teal-500 dark:hover:border-teal-500 dark:hover:text-teal-400 transition-colors flex items-center justify-center gap-2"
                        >
                            <IconLoader name="plus" size={16} />
                            {lang === 'zh' ? '新建空白项目' : 'New Blank Project'}
                        </button>
                    </div>

                    <h3 className="text-xs font-bold text-stone-500 uppercase mb-3 ml-1">{lang === 'zh' ? '已保存项目' : 'Saved Projects'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {projects.map(project => {
                            const isCurrent = currentProjectId === project.id;
                            // Adapt field names for DB Project vs Legacy
                            const thumb = project.thumbnailUrl || (project as any).thumbnail;
                            const dateVal = project.updatedAt ? new Date(project.updatedAt) : new Date(Number((project as any).timestamp));

                            return (
                                <div
                                    key={project.id}
                                    className={`bg-white dark:bg-stone-800 rounded-lg shadow-sm border overflow-hidden group transition-all relative ${isCurrent
                                        ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-teal-500/10'
                                        : 'border-stone-200 dark:border-stone-700 hover:border-teal-300 dark:hover:border-teal-700'
                                        }`}
                                >
                                    {isCurrent && (
                                        <div className="absolute top-2 left-2 z-10 bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                                            {lang === 'zh' ? '当前' : 'Current'}
                                        </div>
                                    )}

                                    {/* Thumbnail */}
                                    <div className="h-32 bg-stone-200 dark:bg-stone-700 relative">
                                        {(isCurrent && thumbnail) || thumb ? (
                                            <img src={(isCurrent && thumbnail) ? thumbnail! : thumb!} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                                                <IconLoader name="image" size={32} />
                                            </div>
                                        )}

                                        {/* Overlay Actions */}
                                        <div className={`absolute inset-0 bg-black/60 flex items-center justify-center gap-3 transition-opacity backdrop-blur-[1px] ${isCurrent ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            {!isCurrent && (
                                                <button
                                                    onClick={() => {
                                                        onRequestConfirm(
                                                            lang === 'zh' ? '加载项目' : 'Load Project',
                                                            lang === 'zh' ? '确定加载此项目吗？当前未保存的修改将丢失。' : 'Load this project? Unsaved changes will be lost.',
                                                            () => {
                                                                onLoadProject(project.id);
                                                                onClose();
                                                            }
                                                        );
                                                    }}
                                                    className="p-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transform hover:scale-110 transition-all shadow-lg"
                                                    title={lang === 'zh' ? '加载' : 'Load'}
                                                >
                                                    <IconLoader name="upload" size={16} />
                                                </button>
                                            )}
                                            {isCurrent && (
                                                <button
                                                    onClick={() => {
                                                        onUpdateProjectContent(project.id, thumbnail || undefined);
                                                    }}
                                                    className="p-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 transform hover:scale-110 transition-all shadow-lg"
                                                    title={lang === 'zh' ? '更新内容与封面' : 'Update Content & Thumbnail'}
                                                >
                                                    <IconLoader name="refresh-cw" size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    onRequestConfirm(
                                                        lang === 'zh' ? '删除项目' : 'Delete Project',
                                                        lang === 'zh' ? '确定删除此项目吗？' : 'Delete this project?',
                                                        () => onDeleteProject(project.id)
                                                    );
                                                }}
                                                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transform hover:scale-110 transition-all shadow-lg"
                                                title={lang === 'zh' ? '删除' : 'Delete'}
                                            >
                                                <IconLoader name="trash" size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Meta */}
                                    <div className="p-3">
                                        {editingId === project.id ? (
                                            <div className="flex gap-2">
                                                <input
                                                    autoFocus
                                                    className="flex-1 text-xs px-1 py-0.5 rounded border border-teal-500 bg-white dark:bg-stone-900"
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleConfirmEdit()}
                                                />
                                                <button onClick={handleConfirmEdit} className="text-green-500"><IconLoader name="check" size={14} /></button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`font-bold text-sm truncate max-w-[150px] ${isCurrent ? 'text-teal-600 dark:text-teal-400' : 'text-stone-800 dark:text-stone-200'}`} title={project.name}>{project.name}</h3>
                                                    <p className="text-[10px] text-stone-400 mt-0.5">
                                                        {dateVal.toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <button onClick={() => handleStartEdit(project)} className="text-stone-400 hover:text-stone-600 p-1">
                                                    <IconLoader name="edit" size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectManagerModal;
