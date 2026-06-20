// ============================================================
// Changelog / Update Log Data
// ============================================================

export interface ChangelogEntry {
  /** ISO date string YYYY-MM-DD */
  date: string;
  /** Semantic version */
  version: string;
  /** Short announcement for the top bar */
  announcement: string;
  /** Full list of changes */
  changes: string[];
  /** Optional: type tag for filtering/color */
  type?: 'feature' | 'fix' | 'improvement' | 'breaking';
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-05-14',
    version: '1.3.0',
    announcement: '🎨 新增 Sticker Design Skill — 7种风格×6种形状，支持贴纸集合',
    changes: [
      '新增 Sticker Design Skill：7种艺术风格（扁平、Q版、立体膨胀、珐琅、镀铬、模切、复古）',
      '支持6种贴纸形状：自定义轮廓、圆形、方形、圆角矩形、星形、心形',
      '支持贴纸集合（Sticker Sheet）模式，一键生成6-12张统一风格贴纸',
      '优化 Sticker Prompt 构建器，增加严格的视觉规范和负面约束',
      '新增6种 AI Visual Prompt Cookbook 视觉风格模板',
    ],
    type: 'feature',
  },
  {
    date: '2026-05-13',
    version: '1.2.0',
    announcement: '📊 新增 Skill Discovery 自动发现 pipeline',
    changes: [
      '新增 Skill Discovery Pipeline：每日自动发现 GitHub 上的文生图 Skill',
      '集成 AI Visual Prompt Cookbook 66种视觉风格到风格模板系统',
      '优化 Dev 模式 Prompt 预览弹窗的交互体验',
      '修复批量生成模式下图片保存到画布的坐标偏移问题',
    ],
    type: 'feature',
  },
  {
    date: '2026-05-10',
    version: '1.1.0',
    announcement: '🚀 新增 Logo Design Skill 和批量生成模式',
    changes: [
      '新增 Logo Design Skill：支持多种风格和尺寸',
      '新增批量生成模式（Batch Mode）：可一次生成多张相关图片',
      '新增项目管理系统：支持创建、保存、切换、重命名项目',
      '新增画板（Artboard）功能：拖拽排列生成的图片',
      '支持图片历史记录和详情查看',
    ],
    type: 'feature',
  },
  {
    date: '2026-05-08',
    version: '1.0.0',
    announcement: '🎉 MuseUI 正式发布！AI 驱动的 UI 设计生成器',
    changes: [
      'MuseUI 首个正式版本发布',
      '支持 OpenAI 兼容多模型 API',
      '支持生成 UI 原型、封面图、信息图、小红书图、漫画、PPT',
      '支持 Design.md 设计系统导入',
      '支持视觉风格模板和布局密度策略',
      '支持多语言（中文/英文）',
    ],
    type: 'feature',
  },
];

/** Get the latest version */
export const getLatestVersion = (): string => CHANGELOG[0]?.version ?? '1.0.0';

/** Get all announcements for the ticker */
export const getAnnouncements = (): string[] =>
  CHANGELOG.map((entry) => entry.announcement);

/** Get entries grouped by month for the modal */
export const getChangelogByMonth = (): Record<string, ChangelogEntry[]> => {
  const grouped: Record<string, ChangelogEntry[]> = {};
  CHANGELOG.forEach((entry) => {
    const month = entry.date.slice(0, 7); // YYYY-MM
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(entry);
  });
  return grouped;
};
