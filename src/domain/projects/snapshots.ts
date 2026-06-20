import type { AppConfigExport, Project } from '../../types';

export const APP_CONFIG_SNAPSHOT_VERSION = 2;

const hasConfigValue = (source: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(source, key);

export const restoreConfigSnapshot = (
  snapshot: Record<string, any> | null | undefined,
  config: any,
  canvas: any,
) => {
  if (!snapshot) return;

  if (hasConfigValue(snapshot, 'platform')) config.setPlatform(snapshot.platform);
  if (hasConfigValue(snapshot, 'resolution')) config.setResolution(snapshot.resolution);
  if (hasConfigValue(snapshot, 'customSize')) config.setCustomSize(snapshot.customSize);
  if (hasConfigValue(snapshot, 'customStyles')) config.setCustomStyles(snapshot.customStyles || []);
  if (hasConfigValue(snapshot, 'style')) config.setStyle(snapshot.style);
  if (hasConfigValue(snapshot, 'description')) config.setDescription(snapshot.description || '');
  if (hasConfigValue(snapshot, 'pageName')) config.setPageName(snapshot.pageName || '');
  if (hasConfigValue(snapshot, 'keywords')) config.setKeywords(snapshot.keywords || []);
  if (hasConfigValue(snapshot, 'enableDesignTokens')) config.setEnableDesignTokens(!!snapshot.enableDesignTokens);
  if (hasConfigValue(snapshot, 'designTokens')) config.setDesignTokens(snapshot.designTokens);
  if (hasConfigValue(snapshot, 'background')) config.setBackground(snapshot.background);
  if (hasConfigValue(snapshot, 'highQuality')) config.setHighQuality(!!snapshot.highQuality);
  if (hasConfigValue(snapshot, 'forceChinese')) config.setForceChinese(!!snapshot.forceChinese);
  if (hasConfigValue(snapshot, 'promptLanguage')) config.setPromptLanguage(snapshot.promptLanguage ?? null);
  if (hasConfigValue(snapshot, 'preferredImageApiId')) config.setPreferredImageApiId(snapshot.preferredImageApiId ?? null);
  if (hasConfigValue(snapshot, 'designMdId')) config.setDesignMdId(snapshot.designMdId ?? null);
  if (hasConfigValue(snapshot, 'designMdContent')) config.setDesignMdContent(snapshot.designMdContent ?? null);
  if (hasConfigValue(snapshot, 'visualStyleId')) config.setVisualStyleId(snapshot.visualStyleId ?? null);
  if (hasConfigValue(snapshot, 'visualStyleContent')) config.setVisualStyleContent(snapshot.visualStyleContent ?? null);
  if (hasConfigValue(snapshot, 'layoutDensityId')) config.setLayoutDensityId(snapshot.layoutDensityId ?? null);
  if (hasConfigValue(snapshot, 'layoutDensityContent')) config.setLayoutDensityContent(snapshot.layoutDensityContent ?? null);
  if (hasConfigValue(snapshot, 'isBatchMode')) config.setIsBatchMode(!!snapshot.isBatchMode);
  if (hasConfigValue(snapshot, 'batchOutputMode')) config.setBatchOutputMode(snapshot.batchOutputMode);
  if (hasConfigValue(snapshot, 'specMode')) config.setSpecMode(snapshot.specMode);
  if (hasConfigValue(snapshot, 'pages')) config.setPages(snapshot.pages || []);
  if (hasConfigValue(snapshot, 'mediaAspectRatio')) config.setMediaAspectRatio(snapshot.mediaAspectRatio);
  if (hasConfigValue(snapshot, 'mediaResolution')) config.setMediaResolution(snapshot.mediaResolution);
  if (hasConfigValue(snapshot, 'mediaType')) config.setMediaType(snapshot.mediaType);
  if (hasConfigValue(snapshot, 'activeRole')) config.setActiveRole(snapshot.activeRole);
  if (hasConfigValue(snapshot, 'skillMode')) config.setSkillMode(!!snapshot.skillMode);
  if (hasConfigValue(snapshot, 'activeSkill')) config.setActiveSkill(snapshot.activeSkill ?? null);
  if (hasConfigValue(snapshot, 'skillConfig')) config.setSkillConfig(snapshot.skillConfig ?? null);
  if (hasConfigValue(snapshot, 'layoutImage')) canvas.updateLayoutImage(snapshot.layoutImage ?? null);
  if (hasConfigValue(snapshot, 'layoutElements')) canvas.setLayoutElements(snapshot.layoutElements || []);
};

export const restoreProjectConfig = (project: Project, config: any, canvas: any) => {
  restoreConfigSnapshot(project.config as Record<string, any> | undefined, config, canvas);
};

export const buildProjectConfigSnapshot = (config: any, canvas: any) => ({
  version: APP_CONFIG_SNAPSHOT_VERSION,
  platform: config.platform,
  resolution: config.resolution,
  customSize: config.customSize,
  style: config.style,
  customStyles: config.customStyles,
  description: config.description,
  pageName: config.pageName,
  keywords: config.keywords,
  enableDesignTokens: config.enableDesignTokens,
  designTokens: config.designTokens,
  background: config.background,
  highQuality: config.highQuality,
  forceChinese: config.forceChinese,
  promptLanguage: config.promptLanguage,
  preferredImageApiId: config.preferredImageApiId,
  designMdId: config.designMdId,
  designMdContent: config.designMdContent,
  visualStyleId: config.visualStyleId,
  visualStyleContent: config.visualStyleContent,
  layoutDensityId: config.layoutDensityId,
  layoutDensityContent: config.layoutDensityContent,
  isBatchMode: config.isBatchMode,
  batchOutputMode: config.batchOutputMode,
  specMode: config.specMode,
  pages: config.pages,
  activeRole: config.activeRole,
  mediaAspectRatio: config.mediaAspectRatio,
  mediaResolution: config.mediaResolution,
  mediaType: config.mediaType,
  skillMode: config.skillMode,
  activeSkill: config.activeSkill,
  skillConfig: config.skillConfig,
  layoutImage: canvas.layoutImage,
  layoutElements: canvas.layoutElements,
});

export const buildExportConfig = (snapshot: ReturnType<typeof buildProjectConfigSnapshot>): AppConfigExport => ({
  timestamp: Date.now(),
  ...snapshot,
  designMdId: snapshot.designMdId || undefined,
  designMdContent: snapshot.designMdContent || undefined,
  visualStyleId: snapshot.visualStyleId || undefined,
  visualStyleContent: snapshot.visualStyleContent || undefined,
  layoutDensityId: snapshot.layoutDensityId || undefined,
  layoutDensityContent: snapshot.layoutDensityContent || undefined,
  styleImages: [],
  contentImages: [],
} as AppConfigExport);
