
import { ResolutionPreset, UIStyle, PlatformType, MediaAspectRatio, MediaResolutionPreset, MediaTypeOption, MediaType } from './types';

export const PLATFORMS: { id: PlatformType; label: string; label_zh: string; icon: string }[] = [
  {
    id: 'mobile', label: 'Mobile', label_zh: '手机',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />'
  },
  {
    id: 'tablet', label: 'Tablet', label_zh: '平板',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />'
  },
  {
    id: 'pc', label: 'Desktop', label_zh: '桌面端',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />'
  },
  {
    id: 'browser', label: 'Browser', label_zh: '浏览器',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />'
  },
];

// Generic Resolutions instead of specific models
export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  // Mobile Portrait
  { id: 'mobile-sm', name: 'Mobile Small (iPhone SE)', name_zh: '小屏手机 (375x667)', width: 375, height: 667, type: 'mobile' },
  { id: 'mobile-md', name: 'Mobile Medium (iOS Standard)', name_zh: '标准手机 (390x844)', width: 390, height: 844, type: 'mobile' },
  { id: 'mobile-lg', name: 'Mobile Large (Pro Max)', name_zh: '大屏手机 (430x932)', width: 430, height: 932, type: 'mobile' },
  { id: 'mobile-android', name: 'Android Standard', name_zh: 'Android 标准 (360x800)', width: 360, height: 800, type: 'mobile' },
  // Mobile Landscape
  { id: 'mobile-land-sm', name: 'Mobile Landscape (Small)', name_zh: '手机横屏 (667x375)', width: 667, height: 375, type: 'mobile' },
  { id: 'mobile-land-md', name: 'Mobile Landscape (Std)', name_zh: '手机横屏 (844x390)', width: 844, height: 390, type: 'mobile' },
  { id: 'mobile-land-lg', name: 'Mobile Landscape (Large)', name_zh: '手机横屏 (932x430)', width: 932, height: 430, type: 'mobile' },

  // Tablet Portrait
  { id: 'tablet-sm', name: 'Tablet Small (iPad Mini)', name_zh: '小平板 (744x1133)', width: 744, height: 1133, type: 'tablet' },
  { id: 'tablet-md', name: 'Tablet Medium (iPad Air)', name_zh: '标准平板 (820x1180)', width: 820, height: 1180, type: 'tablet' },
  { id: 'tablet-lg', name: 'Tablet Large (iPad Pro)', name_zh: '大平板 (1024x1366)', width: 1024, height: 1366, type: 'tablet' },
  // Tablet Landscape
  { id: 'tablet-land-sm', name: 'Tablet Landscape (Small)', name_zh: '平板横屏 (1133x744)', width: 1133, height: 744, type: 'tablet' },
  { id: 'tablet-land-md', name: 'Tablet Landscape (Std)', name_zh: '平板横屏 (1180x820)', width: 1180, height: 820, type: 'tablet' },
  { id: 'tablet-land-lg', name: 'Tablet Landscape (Pro)', name_zh: '平板横屏 (1366x1024)', width: 1366, height: 1024, type: 'tablet' },

  // PC / Desktop
  { id: 'laptop-sm', name: 'Laptop (13")', name_zh: '笔记本 13" (1280x800)', width: 1280, height: 800, type: 'pc' },
  { id: 'laptop-md', name: 'Laptop (15")', name_zh: '笔记本 15" (1440x900)', width: 1440, height: 900, type: 'pc' },
  { id: 'desktop-hd', name: 'Desktop HD', name_zh: '桌面显示器 (1920x1080)', width: 1920, height: 1080, type: 'pc' },
  { id: 'desktop-2k', name: 'Desktop 2K', name_zh: '2K 显示器 (2560x1440)', width: 2560, height: 1440, type: 'pc' },

  // Browser (Often implies windowed)
  { id: 'browser-hd', name: 'Browser Window HD', name_zh: '浏览器窗口 HD', width: 1280, height: 720, type: 'browser' },
  { id: 'browser-full', name: 'Browser Full', name_zh: '浏览器全屏', width: 1440, height: 900, type: 'browser' },
];

export const UI_STYLES: UIStyle[] = [
  // Special Logic Styles
  { id: 'reference-based', name: 'Based on Reference', name_zh: '基于参考图', category: 'Custom', description: 'Prioritize style from uploaded images.', description_zh: '优先遵循上传图片的风格。', promptModifier: 'visually consistent with the provided style reference images, extract color palette and design language from reference' },
  { id: 'ai-auto', name: 'AI Auto Style', name_zh: 'AI 自动风格', category: 'Custom', description: 'Let AI decide the best style for the content.', description_zh: '由 AI 根据内容决定最佳风格。', promptModifier: 'professional high-quality UI design, aesthetic, trending Dribbble style, clean interface' },

  // --- Mainstream / Corporate ---
  { id: 'minimalist', name: 'Modern Minimalist', name_zh: '现代极简', category: 'Mainstream', description: 'Clean lines, whitespace, neutral.', description_zh: '线条简洁，留白充足，中性色调。', promptModifier: 'minimalist, clean, modern, whitespace, sans-serif typography, subtle shadows, professional corporate look' },
  { id: 'material', name: 'Material Design 3', name_zh: 'Material Design 3', category: 'Mainstream', description: 'Google Material guidelines, dynamic color.', description_zh: 'Google Material 规范，动态取色。', promptModifier: 'Material Design 3, dynamic colors, rounded corners, card-based layout, elevation, floating action buttons, Google Sans font' },
  { id: 'ios-human', name: 'Human Interface', name_zh: 'iOS 风格', category: 'Mainstream', description: 'Apple HIG, blur effects, refined.', description_zh: 'Apple HIG，毛玻璃，精致排版。', promptModifier: 'Apple Human Interface Guidelines, blur effects, translucency, SF Pro font, refined icons, iOS style, premium feel' },
  { id: 'bento-grid', name: 'Bento Grid', name_zh: 'Bento 栅格', category: 'Mainstream', description: 'Modular, card-based, structured.', description_zh: '模块化，卡片式布局，结构化。', promptModifier: 'bento grid layout, modular cards, structured information density, rounded rectangles, clean organization, dashboard style' },
  { id: 'swiss-style', name: 'Swiss Style', name_zh: '瑞士风格', category: 'Mainstream', description: 'Grid-based, bold typography.', description_zh: '网格，大胆排版，不对称。', promptModifier: 'Swiss Design style, International Typographic Style, grid systems, asymmetrical layout, sans-serif typography, objectivity, high contrast' },
  { id: 'corporate-clean', name: 'Corporate Clean', name_zh: '企业商务', category: 'Mainstream', description: 'Trustworthy, blue tones, standard.', description_zh: '值得信赖，蓝色调，标准布局。', promptModifier: 'corporate web design, clean, trustworthy, blue color palette, professional, standard layout, business oriented' },
  { id: 'saas-dashboard', name: 'SaaS Dashboard', name_zh: 'SaaS 仪表盘', category: 'Mainstream', description: 'Data-rich, sidebar navigation, charts.', description_zh: '数据丰富，侧边导航，图表。', promptModifier: 'SaaS dashboard UI, data visualization, charts, sidebar navigation, analytics, dense information, clean tables' },
  { id: 'ecommerce', name: 'E-commerce', name_zh: '电商风格', category: 'Mainstream', description: 'Product focused, vibrant CTA.', description_zh: '强调产品，醒目按钮。', promptModifier: 'e-commerce app UI, product cards, shopping cart, buy buttons, promotional banners, high conversion layout' },
  { id: 'fintech', name: 'FinTech Trust', name_zh: '金融科技', category: 'Mainstream', description: 'Secure, clean numbers, dark blue/green.', description_zh: '安全感，清晰数字，深蓝/绿。', promptModifier: 'fintech app UI, banking interface, secure feel, clean typography for numbers, data graphs, trustworthiness' },
  { id: 'social-vibrant', name: 'Social Vibrant', name_zh: '社交活力', category: 'Mainstream', description: 'Bright colors, round avatars, feed.', description_zh: '亮色，圆形头像，信息流。', promptModifier: 'social media app UI, vibrant colors, round avatars, infinite scroll feed, story circles, engagement buttons' },
  { id: 'news-editorial', name: 'News Editorial', name_zh: '新闻阅读', category: 'Mainstream', description: 'Serif fonts, white paper feel.', description_zh: '衬线字体，纸张感，阅读体验。', promptModifier: 'editorial news app, serif headlines, white paper texture, high readability, classic newspaper layout, elegant' },
  { id: 'travel-explore', name: 'Travel & Explore', name_zh: '旅游探索', category: 'Mainstream', description: 'Full-screen images, immersive.', description_zh: '全屏大图，沉浸式体验。', promptModifier: 'travel app UI, full screen photography, immersive experience, booking cards, location pins, adventurous vibe' },
  { id: 'medical-clean', name: 'Medical Clean', name_zh: '医疗健康', category: 'Mainstream', description: 'Sterile, teal/white, calming.', description_zh: '洁净，青/白配色，宁静。', promptModifier: 'medical healthcare app, sterile clean look, teal and white palette, calming, accessible, professional medical interface' },
  { id: 'education', name: 'EdTech', name_zh: '在线教育', category: 'Mainstream', description: 'Friendly, progress bars, gamified.', description_zh: '友好，进度条，游戏化。', promptModifier: 'education app UI, learning management system, progress tracking, friendly illustrations, gamification elements' },
  { id: 'food-delivery', name: 'Food Delivery', name_zh: '外卖餐饮', category: 'Mainstream', description: 'Appetizing photos, orange/red.', description_zh: '诱人图片，橙/红配色。', promptModifier: 'food delivery app, appetizing photography, orange and red accents, menu cards, fast service vibe' },

  // --- Creative ---
  { id: 'glassmorphism', name: 'Glassmorphism', name_zh: '玻璃拟态', category: 'Creative', description: 'Frosted glass, vivid backgrounds.', description_zh: '磨砂玻璃，生动背景。', promptModifier: 'glassmorphism, frosted glass, backdrop blur, vivid gradients, floating elements, translucent cards, white borders' },
  { id: 'neubrutalism', name: 'Neubrutalism', name_zh: '新粗野主义', category: 'Creative', description: 'High contrast, bold borders, raw.', description_zh: '高对比度，粗黑边框，原始感。', promptModifier: 'neubrutalism, high contrast, bold black borders, flat colors, raw aesthetic, retro typography, hard shadows, neo-brutalist' },
  { id: 'claymorphism', name: 'Claymorphism', name_zh: '黏土拟态', category: 'Creative', description: 'Soft 3D, inflated, friendly.', description_zh: '柔和3D，膨胀感，亲切。', promptModifier: 'claymorphism, soft 3D, inflated shapes, pastel colors, inner shadows, rounded, friendly, toy-like texture' },
  { id: 'y2k', name: 'Y2K / Acid', name_zh: 'Y2K / 酸性设计', category: 'Creative', description: 'Chrome, iridescent, futuristic retro.', description_zh: '金属质感，彩虹色，未来复古。', promptModifier: 'Y2K aesthetic, acid graphics, chrome lettering, liquid metal textures, iridescent colors, futuristic retro, bold distortion' },
  { id: 'neumorphism', name: 'Neumorphism', name_zh: '新拟态 (Soft UI)', category: 'Creative', description: 'Soft shadows, extruded shapes.', description_zh: '柔和阴影，凸起形状。', promptModifier: 'neumorphism, soft UI, monochromatic, extruded plastic shapes, soft shadows, inner glow, tactile feel' },
  { id: 'holographic', name: 'Holographic', name_zh: '全息幻彩', category: 'Creative', description: 'Iridescent foil, shimmering.', description_zh: '镭射箔，闪烁，流光溢彩。', promptModifier: 'holographic UI, iridescent foil textures, shimmering gradients, futuristic fashion, ethereal, prismatic' },
  { id: 'abstract-geo', name: 'Abstract Geometric', name_zh: '抽象几何', category: 'Creative', description: 'Bold shapes, bauhaus influence.', description_zh: '大胆形状，包豪斯影响。', promptModifier: 'abstract geometric patterns, bauhaus influence, bold shapes, primary colors, artistic composition, structured chaos' },
  { id: 'fluid-liquid', name: 'Fluid Liquid', name_zh: '流动液体', category: 'Creative', description: 'Organic blobs, gradients.', description_zh: '有机斑点，渐变流动。', promptModifier: 'fluid liquid UI, organic blobs, melting shapes, smooth gradients, morphing forms, dynamic background' },
  { id: 'collage-art', name: 'Collage Art', name_zh: '拼贴艺术', category: 'Creative', description: 'Cutout paper, mixed media.', description_zh: '剪纸，混合媒介，复古拼贴。', promptModifier: 'collage art style, mixed media, paper cutouts, vintage textures, ripped edges, artistic composition' },
  { id: 'glitch-art', name: 'Glitch Art', name_zh: '故障艺术', category: 'Creative', description: 'Digital distortion, noise.', description_zh: '数字失真，噪点，信号故障。', promptModifier: 'glitch art UI, digital distortion, pixel sorting, chromatic aberration, tv static, data moshing, raw tech' },
  { id: 'pop-art', name: 'Pop Art', name_zh: '波普艺术', category: 'Creative', description: 'Comic style, halftones, bold.', description_zh: '漫画风，半调网点，大胆。', promptModifier: 'pop art style, roy lichtenstein inspired, halftone dots, comic book aesthetic, bold outlines, vibrant primary colors' },
  { id: 'gradient-mesh', name: 'Gradient Mesh', name_zh: '渐变网格', category: 'Creative', description: 'Smooth multicolor transitions.', description_zh: '平滑多色过渡，梦幻。', promptModifier: 'aurora gradients, gradient mesh background, soft color transitions, dreamy, ethereal, modern blur' },
  { id: 'memphis', name: 'Memphis', name_zh: '孟菲斯', category: 'Creative', description: '80s patterns, squiggles, confetti.', description_zh: '80年代图案，波浪线，彩色碎屑。', promptModifier: 'memphis design style, 80s patterns, squiggles, geometric shapes, confetti, pastel and bright colors, retro fun' },
  { id: 'isometric-3d', name: 'Isometric 3D', name_zh: '等轴 3D', category: 'Creative', description: '3D floating elements, orthographic.', description_zh: '3D 悬浮元素，正交投影。', promptModifier: 'isometric 3D UI, floating islands, 3D icons, orthographic view, clean render, toy-like' },
  { id: 'origami', name: 'Origami', name_zh: '折纸艺术', category: 'Creative', description: 'Folded paper, sharp shadows.', description_zh: '折叠纸张，锐利阴影。', promptModifier: 'origami style, folded paper, sharp creases, realistic paper shadows, layered depth, craft aesthetic' },

  // --- Niche / Dev / Retro ---
  { id: 'cyberpunk', name: 'Cyberpunk', name_zh: '赛博朋克', category: 'Niche', description: 'Neon, dark mode, futuristic HUD.', description_zh: '霓虹，暗黑，未来 HUD。', promptModifier: 'cyberpunk, neon glow, dark mode, futuristic HUD, glitch effects, tech-noir, matrix green, high tech, sci-fi interface' },
  { id: 'retro-pixel', name: 'Retro Pixel', name_zh: '复古像素', category: 'Niche', description: '8-bit, chunky fonts.', description_zh: '8-bit，像素风，粗字体。', promptModifier: 'pixel art style, 8-bit aesthetic, retro gaming interface, chunky fonts, limited color palette, arcade game vibe' },
  { id: 'game-ui', name: 'Game HUD', name_zh: '游戏界面', category: 'Niche', description: 'RPG stats, inventory, fantasy.', description_zh: 'RPG 属性，背包，奇幻感。', promptModifier: 'video game UI, RPG HUD, fantasy interface, health bars, inventory slots, ornate borders, magical glowing effects' },
  { id: 'terminal', name: 'Terminal / CLI', name_zh: '极客终端', category: 'Niche', description: 'Monospace, green on black.', description_zh: '等宽字体，黑底绿字。', promptModifier: 'terminal UI, command line interface, monospace font, green text on black background, retro computing, hacker aesthetics' },
  { id: 'win95', name: 'Windows 95', name_zh: 'Win 95 复古', category: 'Niche', description: 'Beige, bevels, pixel icons.', description_zh: '米色，斜面，像素图标。', promptModifier: 'Windows 95 aesthetic, retro UI, beige background, heavy bevels, pixelated icons, classic desktop' },
  { id: 'vaporwave', name: 'Vaporwave', name_zh: '蒸汽波', category: 'Niche', description: 'Pink/purple, greek statues, retro.', description_zh: '粉紫，雕像，复古电脑。', promptModifier: 'vaporwave aesthetic, pink and purple gradients, retro computer graphics, greek statues, palm trees, nostalgic' },
  { id: 'synthwave', name: 'Synthwave', name_zh: '合成波', category: 'Niche', description: 'Retro-futurism, grid, sunset.', description_zh: '复古未来，网格，夕阳。', promptModifier: 'synthwave style, outrun aesthetic, retro-futurism, neon grids, sunset gradients, 80s sci-fi' },
  { id: 'solarized', name: 'Solarized', name_zh: 'Solarized', category: 'Niche', description: 'Low contrast, developer friendly.', description_zh: '低对比度，护眼，极客。', promptModifier: 'Solarized color scheme, low contrast, developer focused, clean code aesthetic' },
  { id: 'dracula', name: 'Dracula Theme', name_zh: 'Dracula 主题', category: 'Niche', description: 'Dark purple, vampire theme.', description_zh: '深紫色，吸血鬼主题配色。', promptModifier: 'Dracula theme, dark purple background, vibrant accents, coding environment aesthetic' },
  { id: 'gruvbox', name: 'Gruvbox', name_zh: 'Gruvbox', category: 'Niche', description: 'Retro groove, warm earth tones.', description_zh: '复古律动，暖土色调。', promptModifier: 'Gruvbox theme, retro groove, warm earth tones, reddish-brown, vintage coding style' },
  { id: 'blueprint', name: 'Blueprint', name_zh: '工程蓝图', category: 'Niche', description: 'White lines, blue background.', description_zh: '白线，蓝底，工程感。', promptModifier: 'blueprint style, technical drawing, white lines on blue background, grid paper, engineering aesthetic, schematic' },
  { id: 'chalkboard', name: 'Chalkboard', name_zh: '黑板手绘', category: 'Niche', description: 'Chalk texture, dusty.', description_zh: '粉笔纹理，粉尘感。', promptModifier: 'chalkboard UI, chalk texture, hand drawn diagrams, dusty background, school aesthetic' },
  { id: 'low-poly', name: 'Low Poly', name_zh: '低多边形', category: 'Niche', description: 'Faceted, geometric 3D.', description_zh: '多面体，几何 3D。', promptModifier: 'low poly art style, faceted geometry, flat shading, 3D polygons, sharp edges, minimalistic 3D' },
  { id: 'sci-fi-fui', name: 'Sci-Fi FUI', name_zh: '科幻 FUI', category: 'Niche', description: 'Complex data, fine lines, HUD.', description_zh: '复杂数据，细线，HUD。', promptModifier: 'Sci-Fi FUI, fictional user interface, iron man HUD style, complex data visualization, fine glowing lines, technical' },
  { id: 'western', name: 'Western', name_zh: '西部牛仔', category: 'Niche', description: 'Wood, leather, wanted posters.', description_zh: '木纹，皮革，通缉令。', promptModifier: 'wild western style, wood textures, leather UI elements, vintage typography, wanted poster aesthetic, sepia tones' },

  // --- Special / Theme ---
  { id: 'monster-core', name: 'Monster Core', name_zh: '怪兽派对', category: 'Special', description: 'Furry, googly eyes, vibrant.', description_zh: '毛茸茸，大眼睛，鲜艳。', promptModifier: 'monster core aesthetic, cute monsters, fur textures, vibrant colors, playful, googly eyes on UI elements, organic shapes, fun typography' },
  { id: 'plant-zombie', name: 'Botanical Horror', name_zh: '植物僵尸', category: 'Special', description: 'Organic decay, vines, spooky.', description_zh: '有机腐烂，藤蔓，怪诞。', promptModifier: 'botanical horror style, zombie plants, overgrown vines, green and purple color palette, organic decay, spooky cute, bio-luminescent details, halloween vibe' },
  { id: 'steampunk', name: 'Steampunk', name_zh: '蒸汽朋克', category: 'Special', description: 'Brass, gears, victorian.', description_zh: '黄铜，齿轮，维多利亚。', promptModifier: 'steampunk aesthetic, brass and copper textures, gears, clockwork mechanisms, victorian ornamentation, parchment backgrounds, mechanical buttons' },
  { id: 'watercolor', name: 'Watercolor', name_zh: '水彩画风', category: 'Special', description: 'Soft washes, paper texture.', description_zh: '柔和晕染，纸张纹理。', promptModifier: 'watercolor painting style, soft edges, paper texture background, artistic paint washes, pastel palette, hand-painted UI elements, artistic' },
  { id: 'paper-cutout', name: 'Paper Cutout', name_zh: '剪纸风格', category: 'Special', description: 'Layered paper, depth shadows.', description_zh: '层叠纸张，深度阴影。', promptModifier: 'paper cutout style, layered paper art, depth and drop shadows, craft aesthetic, textured paper, collage look' },
  { id: 'gothic', name: 'Gothic', name_zh: '哥特风格', category: 'Special', description: 'Dark, ornate, medieval.', description_zh: '黑暗，华丽，中世纪。', promptModifier: 'gothic aesthetic, dark moody, ornate medieval details, blackletter typography, stained glass elements, mysterious' },
  { id: 'kids-cartoon', name: 'Kids Cartoon', name_zh: '儿童卡通', category: 'Special', description: 'Big buttons, primary colors.', description_zh: '大按钮，三原色，圆润。', promptModifier: 'kids cartoon UI, chunky buttons, primary colors, rounded shapes, playful mascot, simple interface, fun' },
  { id: 'anime-manga', name: 'Anime / Manga', name_zh: '日系动漫', category: 'Special', description: 'Speed lines, cel shading.', description_zh: '速度线，赛璐璐，二次元。', promptModifier: 'anime style UI, manga aesthetics, cel shaded, speed lines, kawaii elements, energetic, japanese text styling' },
  { id: 'graffiti', name: 'Graffiti Street', name_zh: '街头涂鸦', category: 'Special', description: 'Spray paint, drips, urban.', description_zh: '喷漆，流淌，城市街头。', promptModifier: 'graffiti art style, street culture, spray paint textures, drips, urban aesthetic, bold wildstyle typography' },
  { id: 'nature-eco', name: 'Nature Eco', name_zh: '自然环保', category: 'Special', description: 'Leaves, wood, earth tones.', description_zh: '树叶，木质，大地色。', promptModifier: 'nature eco friendly UI, leaves and vines, wood textures, earth tones, organic shapes, sustainable vibe, fresh' },
  { id: 'underwater', name: 'Underwater', name_zh: '深海探险', category: 'Special', description: 'Blue bubbles, caustic light.', description_zh: '蓝色气泡，焦散光。', promptModifier: 'underwater aesthetic, deep blue ocean, bubbles, caustic lighting effects, aquatic life, fluid motion' },
  { id: 'space-cosmos', name: 'Cosmos', name_zh: '浩瀚宇宙', category: 'Special', description: 'Stars, nebula, dark void.', description_zh: '星空，星云，深邃虚空。', promptModifier: 'space cosmos UI, starry background, nebula clouds, deep dark void, futuristic glass, astronomical' },
  { id: 'luxury-fashion', name: 'Luxury Fashion', name_zh: '奢华时尚', category: 'Special', description: 'Gold, black, serif, elegant.', description_zh: '金黑配色，衬线，优雅。', promptModifier: 'luxury fashion UI, gold accents, black and white, elegant serif typography, high-end editorial look, premium texture' },
  { id: 'automotive', name: 'Automotive', name_zh: '车载仪表', category: 'Special', description: 'High readability, dark mode.', description_zh: '高易读性，暗模式，仪表。', promptModifier: 'automotive UI, car dashboard, high contrast, dark mode, large touch targets, speedometer aesthetic, sleek' },
  { id: 'tv-interface', name: 'TV Interface', name_zh: '电视大屏', category: 'Special', description: 'Focus state, card rows.', description_zh: '焦点状态，卡片行，10ft UI。', promptModifier: 'smart TV interface, 10ft UI, focus states, horizontal scrolling rows, movie poster art, cinematic dark mode' },

  // --- Wireframe ---
  { id: 'wireframe', name: 'Lo-Fi Wireframe', name_zh: '低保真线框', category: 'Wireframe', description: 'Blueprint, black & white lines.', description_zh: '蓝图，黑白线条，结构。', promptModifier: 'low-fidelity wireframe, black and white line art, blueprint style, skeletal framework, no images, placeholder blocks, structural design' },
  { id: 'wireframe-hifi', name: 'Hi-Fi Wireframe', name_zh: '高保真线框', category: 'Wireframe', description: 'Greyscale, detailed layout.', description_zh: '灰度，详细布局，无图。', promptModifier: 'high-fidelity wireframe, greyscale, detailed layout, real text, shades of grey, polished structure, no colored images' },
  { id: 'sketch-whiteboard', name: 'Whiteboard Sketch', name_zh: '白板手绘', category: 'Wireframe', description: 'Marker lines, rough.', description_zh: '马克笔线条，粗糙。', promptModifier: 'whiteboard sketch, hand drawn marker style, rough lines, brainstorming aesthetic, sticky notes, unfinished look' },
  { id: 'user-flow', name: 'User Flow', name_zh: '用户流程图', category: 'Wireframe', description: 'Mini screens, arrows.', description_zh: '迷你屏幕，箭头，流程。', promptModifier: 'user flow diagram, bird eye view, connected screens with arrows, flow chart style, simplified UI thumbnails' },
];

export const CATEGORY_MAP_ZH: Record<string, string> = {
  "Layout & Structure": "布局与结构",
  "Navigation": "导航组件",
  "Input Controls": "输入控件",
  "Feedback & Status": "反馈与状态",
  "Content Display": "内容展示",
  "Visual Effects": "视觉特效",
  "Generic Shapes": "基础形状"
};

export const COMPONENT_CATEGORIES_EN = {
  "Layout & Structure": [
    "Grid Layout", "Sidebar", "Header", "Footer", "Card", "Container", "Split View", "Masonry", "Hero Section"
  ],
  "Navigation": [
    "Tab Bar", "Breadcrumbs", "Pagination", "Stepper", "Mega Menu", "Drawer", "Bottom Navigation", "Segmented Control"
  ],
  "Input Controls": [
    "Search Bar", "Text Field", "Dropdown", "Checkbox", "Radio Button", "Toggle Switch", "Slider", "Date Picker", "File Upload"
  ],
  "Feedback & Status": [
    "Modal / Dialog", "Toast Notification", "Skeleton Loader", "Progress Bar", "Spinner", "Badge", "Empty State", "Tooltip", "Alert"
  ],
  "Content Display": [
    "Avatar", "Carousel", "Accordion", "Timeline", "Data Table", "Tree View", "Tag / Chip", "List View", "Image Gallery"
  ],
  "Visual Effects": [
    "Glassmorphism", "Gradient", "Shadow / Elevation", "Parallax", "Blur Background", "Micro-interaction"
  ]
};

export const COMPONENT_CATEGORIES_ZH = {
  "布局与结构": [
    "网格布局", "侧边栏", "顶部导航", "页脚", "卡片", "容器", "分屏视图", "瀑布流", "首屏 Banner"
  ],
  "导航组件": [
    "标签栏 (Tabs)", "面包屑", "分页器", "步骤条", "超级菜单", "抽屉 (Drawer)", "底部导航", "分段控制器"
  ],
  "输入控件": [
    "搜索栏", "文本框", "下拉菜单", "复选框", "单选框", "开关 (Toggle)", "滑块 (Slider)", "日期选择器", "文件上传"
  ],
  "反馈与状态": [
    "模态弹窗", "Toast 提示", "骨架屏", "进度条", "加载转圈", "徽标 (Badge)", "空状态", "文字提示 (Tooltip)", "警告框"
  ],
  "内容展示": [
    "头像", "轮播图", "手风琴", "时间轴", "数据表格", "树形控件", "标签 (Tag)", "列表视图", "图片画廊"
  ],
  "视觉特效": [
    "玻璃拟态", "渐变", "阴影层级", "视差滚动", "背景模糊", "微交互"
  ]
};

// Colors for Tools
const C_LAYOUT = '#3B82F6'; // Blue
const C_NAV = '#8B5CF6'; // Purple
const C_INPUT = '#10B981'; // Green
const C_FEEDBACK = '#F59E0B'; // Amber
const C_CONTENT = '#EC4899'; // Pink
const C_EFFECT = '#06B6D4'; // Cyan
const C_SHAPE = '#64748B'; // Slate

// SVG Helper
const svg = (content: string, color: string) => `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40' fill='none' stroke='${color.replace('#', '%23')}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>${content}</svg>`;

export const BUILDER_TOOLS = [
  // Generic Shapes
  {
    id: 'brush', category: 'Generic Shapes', label: 'Brush', label_zh: '画笔',
    type: 'brush', color: '#EF4444', defaultW: 100, defaultH: 100,
    preview: svg("<path d='M8 28c4-12 10-4 14 0s10-8 10-16' fill='none'/>", '#EF4444')
  },
  {
    id: 'rect', category: 'Generic Shapes', label: 'Rectangle', label_zh: '矩形',
    type: 'rect', color: C_SHAPE, defaultW: 100, defaultH: 100,
    preview: svg("<rect x='6' y='6' width='28' height='28'/>", C_SHAPE)
  },
  {
    id: 'circle', category: 'Generic Shapes', label: 'Circle', label_zh: '圆形',
    type: 'circle', color: C_SHAPE, defaultW: 80, defaultH: 80,
    preview: svg("<circle cx='20' cy='20' r='14'/>", C_SHAPE)
  },
  {
    id: 'line', category: 'Generic Shapes', label: 'Line / Divider', label_zh: '分割线',
    type: 'rect', color: C_SHAPE, defaultW: 300, defaultH: 2,
    preview: svg("<line x1='4' y1='20' x2='36' y2='20'/>", C_SHAPE)
  },

  // Layout
  {
    id: 'header', category: 'Layout & Structure', label: 'Header', label_zh: '顶部导航',
    type: 'rect', color: C_LAYOUT, defaultW: 390, defaultH: 60,
    preview: svg("<rect x='4' y='4' width='32' height='32'/><line x1='4' y1='14' x2='36' y2='14'/>", C_LAYOUT)
  },
  {
    id: 'footer', category: 'Layout & Structure', label: 'Footer', label_zh: '底部区域',
    type: 'rect', color: C_LAYOUT, defaultW: 390, defaultH: 80,
    preview: svg("<rect x='4' y='4' width='32' height='32'/><line x1='4' y1='26' x2='36' y2='26'/>", C_LAYOUT)
  },
  {
    id: 'sidebar', category: 'Layout & Structure', label: 'Sidebar', label_zh: '侧边栏',
    type: 'rect', color: C_LAYOUT, defaultW: 80, defaultH: 600,
    preview: svg("<rect x='4' y='4' width='32' height='32'/><line x1='14' y1='4' x2='14' y2='36'/>", C_LAYOUT)
  },
  {
    id: 'grid-layout', category: 'Layout & Structure', label: 'Grid', label_zh: '网格',
    type: 'dashed-rect', color: C_LAYOUT, defaultW: 300, defaultH: 200,
    preview: svg("<rect x='4' y='4' width='32' height='32' stroke-dasharray='4 4'/><path d='M20 4v32 M4 20h32' stroke-dasharray='4 4'/>", C_LAYOUT)
  },
  {
    id: 'card', category: 'Layout & Structure', label: 'Card', label_zh: '卡片',
    type: 'round-rect', color: C_LAYOUT, defaultW: 340, defaultH: 200,
    preview: svg("<rect x='4' y='8' width='32' height='24' rx='4' ry='4'/>", C_LAYOUT)
  },
  {
    id: 'container', category: 'Layout & Structure', label: 'Container', label_zh: '容器',
    type: 'dashed-rect', color: C_LAYOUT, defaultW: 300, defaultH: 300,
    preview: svg("<rect x='4' y='4' width='32' height='32' stroke-dasharray='4 4'/>", C_LAYOUT)
  },

  // Navigation
  {
    id: 'tab-bar', category: 'Navigation', label: 'Tab Bar', label_zh: '标签栏',
    type: 'rect', color: C_NAV, defaultW: 390, defaultH: 60,
    preview: svg("<rect x='4' y='24' width='32' height='12'/><circle cx='10' cy='30' r='2'/><circle cx='20' cy='30' r='2'/><circle cx='30' cy='30' r='2'/>", C_NAV)
  },
  {
    id: 'breadcrumbs', category: 'Navigation', label: 'Breadcrumbs', label_zh: '面包屑',
    type: 'rect', color: C_NAV, defaultW: 200, defaultH: 30,
    preview: svg("<path d='M4 20h32M10 16l4 4-4 4M20 16l4 4-4 4'/>", C_NAV)
  },
  {
    id: 'stepper', category: 'Navigation', label: 'Stepper', label_zh: '步骤条',
    type: 'rect', color: C_NAV, defaultW: 300, defaultH: 40,
    preview: svg("<circle cx='8' cy='20' r='4'/><line x1='12' y1='20' x2='28' y2='20'/><circle cx='32' cy='20' r='4'/>", C_NAV)
  },

  // Input Controls
  {
    id: 'button', category: 'Input Controls', label: 'Button', label_zh: '按钮',
    type: 'round-rect', color: C_INPUT, defaultW: 120, defaultH: 44,
    preview: svg("<rect x='4' y='12' width='32' height='16' rx='4' ry='4'/>", C_INPUT)
  },
  {
    id: 'search-bar', category: 'Input Controls', label: 'Search', label_zh: '搜索栏',
    type: 'round-rect', color: C_INPUT, defaultW: 300, defaultH: 40,
    preview: svg("<rect x='4' y='10' width='32' height='20' rx='10' ry='10'/><circle cx='12' cy='20' r='3'/><line x1='15' y1='23' x2='17' y2='25'/>", C_INPUT)
  },
  {
    id: 'text-field', category: 'Input Controls', label: 'Input', label_zh: '输入框',
    type: 'rect', color: C_INPUT, defaultW: 300, defaultH: 48,
    preview: svg("<rect x='4' y='10' width='32' height='20'/><line x1='8' y1='20' x2='24' y2='20'/>", C_INPUT)
  },
  {
    id: 'checkbox', category: 'Input Controls', label: 'Checkbox', label_zh: '复选框',
    type: 'rect', color: C_INPUT, defaultW: 24, defaultH: 24,
    preview: svg("<rect x='8' y='8' width='24' height='24'/><polyline points='12 20 18 26 28 14'/>", C_INPUT)
  },
  {
    id: 'toggle', category: 'Input Controls', label: 'Toggle', label_zh: '开关',
    type: 'round-rect', color: C_INPUT, defaultW: 50, defaultH: 30,
    preview: svg("<rect x='4' y='12' width='32' height='16' rx='8' ry='8'/><circle cx='28' cy='20' r='6'/>", C_INPUT)
  },

  // Content Display
  {
    id: 'image', category: 'Content Display', label: 'Image', label_zh: '图片',
    type: 'rect-x', color: C_CONTENT, defaultW: 200, defaultH: 200,
    preview: svg("<rect x='4' y='4' width='32' height='32'/><line x1='4' y1='4' x2='36' y2='36'/><line x1='36' y1='4' x2='4' y2='36'/>", C_CONTENT)
  },
  {
    id: 'avatar', category: 'Content Display', label: 'Avatar', label_zh: '头像',
    type: 'circle', color: C_CONTENT, defaultW: 64, defaultH: 64,
    preview: svg("<circle cx='20' cy='20' r='14'/><path d='M20 20a6 6 0 00-6-6 6 6 0 006 6z M10 32a10 10 0 0120 0'/>", C_CONTENT)
  },
  {
    id: 'icon', category: 'Content Display', label: 'Icon', label_zh: '图标',
    type: 'circle', color: C_CONTENT, defaultW: 32, defaultH: 32,
    preview: svg("<circle cx='20' cy='20' r='10'/><line x1='20' y1='14' x2='20' y2='26'/><line x1='14' y1='20' x2='26' y2='20'/>", C_CONTENT)
  },
  {
    id: 'text-block', category: 'Content Display', label: 'Text', label_zh: '文本段落',
    type: 'rect', color: C_CONTENT, defaultW: 300, defaultH: 80,
    preview: svg("<line x1='6' y1='10' x2='34' y2='10'/><line x1='6' y1='20' x2='34' y2='20'/><line x1='6' y1='30' x2='24' y2='30'/>", C_CONTENT)
  },
  {
    id: 'heading', category: 'Content Display', label: 'Heading', label_zh: '标题',
    type: 'rect', color: C_CONTENT, defaultW: 200, defaultH: 40,
    preview: svg("<text x='20' y='28' font-size='24' text-anchor='middle' font-weight='bold'>H1</text>", C_CONTENT)
  },
  {
    id: 'tag', category: 'Content Display', label: 'Tag', label_zh: '标签',
    type: 'round-rect', color: C_CONTENT, defaultW: 80, defaultH: 30,
    preview: svg("<path d='M4 10h10l6 10-6 10H4z'/><circle cx='8' cy='20' r='2'/>", C_CONTENT)
  },
  {
    id: 'video', category: 'Content Display', label: 'Video', label_zh: '视频',
    type: 'rect', color: C_CONTENT, defaultW: 300, defaultH: 180,
    preview: svg("<rect x='4' y='6' width='32' height='28'/><polygon points='16,14 26,20 16,26' fill='currentColor'/>", C_CONTENT)
  },
  {
    id: 'map', category: 'Content Display', label: 'Map', label_zh: '地图',
    type: 'rect', color: C_CONTENT, defaultW: 300, defaultH: 200,
    preview: svg("<path d='M4 10l8-4 8 4 8-4 8 4v20l-8-4-8 4-8-4-8 4z'/><line x1='12' y1='6' x2='12' y2='30'/><line x1='20' y1='10' x2='20' y2='34'/><line x1='28' y1='6' x2='28' y2='30'/>", C_CONTENT)
  },

  // Feedback
  {
    id: 'modal', category: 'Feedback & Status', label: 'Modal', label_zh: '弹窗',
    type: 'rect', color: C_FEEDBACK, defaultW: 300, defaultH: 200,
    preview: svg("<rect x='4' y='4' width='32' height='32'/><rect x='10' y='12' width='20' height='16'/>", C_FEEDBACK)
  },
  {
    id: 'alert', category: 'Feedback & Status', label: 'Alert', label_zh: '警告',
    type: 'rect', color: C_FEEDBACK, defaultW: 300, defaultH: 60,
    preview: svg("<rect x='4' y='10' width='32' height='20'/><line x1='12' y1='20' x2='28' y2='20' stroke='red'/>", C_FEEDBACK)
  },
  {
    id: 'progress', category: 'Feedback & Status', label: 'Progress', label_zh: '进度条',
    type: 'rect', color: C_FEEDBACK, defaultW: 300, defaultH: 10,
    preview: svg("<rect x='4' y='16' width='32' height='8'/><rect x='4' y='16' width='20' height='8' fill='currentColor'/>", C_FEEDBACK)
  },

  // Visual
  {
    id: 'fab', category: 'Visual Effects', label: 'FAB', label_zh: '悬浮按钮',
    type: 'circle', color: C_EFFECT, defaultW: 56, defaultH: 56,
    preview: svg("<circle cx='20' cy='20' r='14'/><line x1='20' y1='12' x2='20' y2='28'/><line x1='12' y1='20' x2='28' y2='20'/>", C_EFFECT)
  },
  {
    id: 'chart', category: 'Visual Effects', label: 'Chart', label_zh: '图表',
    type: 'rect', color: C_EFFECT, defaultW: 300, defaultH: 200,
    preview: svg("<rect x='4' y='4' width='32' height='32'/><polyline points='6 30 14 20 22 26 34 10'/>", C_EFFECT)
  }
];

export const TOKEN_SHEET_SKELETON = `data:image/svg+xml;base64,${btoa(`
<svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg" style="background:#1e1e1e">
  <!-- Content preserved -->
</svg>
`)}`;

export const I18N = {
  en: {
    platform: 'Platform',
    resolution: 'Resolution',
    customRes: 'Custom Resolution',
    width: 'Width',
    height: 'Height',
    designStyle: 'Design Style',
    categories: {
      'Wireframe': 'Wireframe',
      'Mainstream': 'Mainstream',
      'Creative': 'Creative',
      'Special': 'Special / Theme',
      'Niche': 'Niche',
      'Custom': 'Custom'
    },
    designTokens: 'Design Tokens',
    primaryColor: 'Primary Theme',
    bgColor: 'App Background',
    accentColor: 'Accent Color',
    decorativeColor: 'Decorative Color',
    radius: 'Corner Radius',
    spacing: 'Spacing / Density',
    tokens: {
      'none': 'None',
      'small': 'Small',
      'medium': 'Medium',
      'large': 'Large',
      'full': 'Full',
      'compact': 'Compact',
      'comfortable': 'Comfortable',
      'spacious': 'Spacious'
    },
    pageName: 'Page / Screen Name',
    pageNamePlaceholder: 'e.g., Login Screen, Dashboard Home...',
    desc: 'Description & Requirements',
    descPlaceholder: 'Describe the UI features, layout, and specific requirements...',
    keywords: 'Components & Elements',
    openBuilder: 'Open Layout Builder',
    removeLayout: 'Remove Layout',
    styleImages: 'Style Reference Images',
    styleImagesHint: 'Upload screenshots to mimic their visual style.',
    contentImages: 'Content Assets',
    contentImagesHint: 'Upload logos, icons, or specific images.',
    upload: 'Upload',
    hqMode: 'High Quality Mode',
    hqHint: 'Uses the high-quality text model',
    processing: 'Generating...',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit & Refine',
    download: 'Download',
    model: 'Model',
    aspect: 'Aspect',
    ready: 'Sketch Canvas Ready',
    readyDesc: 'Your generated designs will appear here as artboards.',
    history: 'History',
    clearHistory: 'Clear',
    errorApiKey: 'API Key is missing.',
    errorQuota: 'Quota exceeded.',
    errorGen: 'Generation failed.',
    editorTitle: 'Edit & Refine Image',
    undo: 'Undo',
    clear: 'Clear',
    textPlaceholder: 'Type text...',
    toolBrush: 'Brush',
    toolText: 'Text',
    brushColor: 'Color',
    brushSize: 'Size',
    regenerate: 'Regenerate',
    builderTitle: 'Layout Builder',
    builderDesc: 'Drag and drop elements.',
    dimensions: 'Dimensions',
    duplicate: 'Duplicate',
    delete: 'Delete',
    extractTokens: 'Extract Wireframe',
    tokenSheet: 'Wireframe Blueprint',
    appBackground: 'Scene / Backdrop',
    solidColor: 'Color',
    bgImage: 'Image',
    selectElement: 'Select Element',
    createStyle: 'Create Custom Style',
    styleName: 'Style Name',
    styleDesc: 'Description',
    stylePrompt: 'AI Prompt Modifier',
    addStyle: 'Add Style',
    theme: 'Theme',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    basicSettings: 'Basic Settings',
    advSettings: 'Visual & Assets',
    genInfo: 'Generation Info',
    gallery: 'Gallery',
    filterBy: 'Filter By',
    all: 'All',
    searchPrompt: 'Search Prompt...',
    selectMode: 'Select Mode',
    selected: 'Selected',
    downloadSelected: 'Download Selected',
    deleteSelected: 'Delete Selected',
    loadSettings: 'Load Settings',
    forceChinese: 'Force Chinese Text',
    forceChineseHint: 'Translate all UI text to Simplified Chinese',
    estTokens: 'Est. Tokens',
    fitToScreen: 'Fit to Screen',
    resetView: 'Reset View',
    aiAutoColors: 'AI Auto Colors',
    aiAutoColorsHint: 'Let AI decide the color palette based on description'
  },
  zh: {
    platform: '平台',
    resolution: '分辨率',
    customRes: '自定义分辨率',
    width: '宽度',
    height: '高度',
    designStyle: '设计风格',
    categories: {
      'Wireframe': '线框图',
      'Mainstream': '主流风格',
      'Creative': '创意风格',
      'Special': '特殊/主题',
      'Niche': '小众风格',
      'Custom': '自定义'
    },
    designTokens: '设计规范 (Tokens)',
    primaryColor: '主题色',
    bgColor: '应用背景色',
    accentColor: '强调色',
    decorativeColor: '装饰色',
    radius: '圆角大小',
    spacing: '间距/密度',
    tokens: {
      'none': '直角',
      'small': '小圆角',
      'medium': '中圆角',
      'large': '大圆角',
      'full': '全圆角',
      'compact': '紧凑',
      'comfortable': '舒适',
      'spacious': '宽松'
    },
    pageName: '页面名称',
    pageNamePlaceholder: '例如：登录页、仪表盘首页...',
    desc: '描述与需求',
    descPlaceholder: '描述 UI 的功能、布局和具体要求...',
    keywords: '组件与元素',
    openBuilder: '打开布局构建器',
    removeLayout: '移除布局',
    styleImages: '风格参考图',
    styleImagesHint: '上传截图以模仿其视觉风格。',
    contentImages: '内容素材',
    contentImagesHint: '上传 LOGO、图标或图片素材。',
    upload: '点击或拖拽上传',
    hqMode: '高质量模式',
    hqHint: '使用高质量文本模型',
    processing: '生成中...',
    cancel: '取消',
    save: '保存',
    edit: '编辑与微调',
    download: '下载',
    model: '模型',
    aspect: '比例',
    ready: '画板就绪',
    readyDesc: '生成的页面将作为画板显示在此处。按住空格拖动画布。',
    history: '历史记录',
    clearHistory: '清空',
    errorApiKey: '缺少 API Key。',
    errorQuota: '配额已用完。',
    errorGen: '生成失败。',
    editorTitle: '编辑与微调图片',
    undo: '撤销',
    clear: '清空画布',
    textPlaceholder: '在此输入文字...',
    toolBrush: '画笔',
    toolText: '文字',
    brushColor: '颜色',
    brushSize: '大小',
    regenerate: '重新生成',
    builderTitle: '布局构建器',
    builderDesc: '拖拽元素以构建线框结构。',
    dimensions: '尺寸',
    duplicate: '复制',
    delete: '删除',
    extractTokens: '提取线框图',
    tokenSheet: '线框结构图',
    appBackground: '场景背景',
    solidColor: '纯色',
    bgImage: '图片',
    selectElement: '选择元素',
    createStyle: '创建自定义风格',
    styleName: '风格名称',
    styleDesc: '描述',
    stylePrompt: 'AI 提示词修饰语',
    addStyle: '添加风格',
    theme: '主题',
    lightMode: '浅色模式',
    darkMode: '深色模式',
    basicSettings: '基础配置',
    advSettings: '视觉与素材',
    genInfo: '生成信息详情',
    gallery: '画廊',
    filterBy: '筛选条件',
    all: '全部',
    searchPrompt: '搜索提示词...',
    selectMode: '多选模式',
    selected: '已选',
    downloadSelected: '批量下载',
    deleteSelected: '批量删除',
    loadSettings: '加载配置',
    forceChinese: '强制中文文案',
    forceChineseHint: '所有 UI 文本使用简体中文',
    estTokens: '预估 Token',
    fitToScreen: '适应屏幕',
    resetView: '重置视图',
    aiAutoColors: 'AI 自动配色',
    aiAutoColorsHint: '由 AI 根据描述自动决定配色方案',
    // Media Mode
    aspectRatio: 'Aspect Ratio',
    mediaType: 'Media Type'
  }
};

// Media Mode Constants
export const MEDIA_ASPECT_RATIOS: { id: MediaAspectRatio; label: string; label_zh: string }[] = [
  { id: '1:1', label: '1:1 Square', label_zh: '1:1 正方形' },
  { id: '3:4', label: '3:4 Portrait', label_zh: '3:4 竖版' },
  { id: '4:3', label: '4:3 Landscape', label_zh: '4:3 横版' },
  { id: '9:16', label: '9:16 Vertical', label_zh: '9:16 竖屏' },
  { id: '16:9', label: '16:9 Widescreen', label_zh: '16:9 宽屏' },
  { id: '2:3', label: '2:3 Portrait', label_zh: '2:3 竖版' },
  { id: '3:2', label: '3:2 Landscape', label_zh: '3:2 横版' },
];

export const MEDIA_RESOLUTIONS: MediaResolutionPreset[] = [
  // 1:1
  { id: '1-1-sm', name: '1:1 Small', name_zh: '1:1 小尺寸', width: 800, height: 800, ratio: '1:1' },
  { id: '1-1-md', name: '1:1 Medium', name_zh: '1:1 中尺寸', width: 1080, height: 1080, ratio: '1:1' },
  { id: '1-1-lg', name: '1:1 Large', name_zh: '1:1 大尺寸', width: 1440, height: 1440, ratio: '1:1' },

  // 3:4
  { id: '3-4-sm', name: '3:4 Small', name_zh: '3:4 小尺寸', width: 750, height: 1000, ratio: '3:4' },
  { id: '3-4-md', name: '3:4 Medium', name_zh: '3:4 中尺寸', width: 1080, height: 1440, ratio: '3:4' },
  { id: '3-4-lg', name: '3:4 Large', name_zh: '3:4 大尺寸', width: 1536, height: 2048, ratio: '3:4' },

  // 4:3
  { id: '4-3-sm', name: '4:3 Small', name_zh: '4:3 小尺寸', width: 1000, height: 750, ratio: '4:3' },
  { id: '4-3-md', name: '4:3 Medium', name_zh: '4:3 中尺寸', width: 1440, height: 1080, ratio: '4:3' },
  { id: '4-3-lg', name: '4:3 Large', name_zh: '4:3 大尺寸', width: 2048, height: 1536, ratio: '4:3' },

  // 9:16
  { id: '9-16-sm', name: '9:16 Small', name_zh: '9:16 小尺寸', width: 720, height: 1280, ratio: '9:16' },
  { id: '9-16-md', name: '9:16 Medium', name_zh: '9:16 中尺寸', width: 1080, height: 1920, ratio: '9:16' },
  { id: '9-16-lg', name: '9:16 Large', name_zh: '9:16 大尺寸', width: 1440, height: 2560, ratio: '9:16' },

  // 16:9
  { id: '16-9-sm', name: '16:9 Small', name_zh: '16:9 小尺寸', width: 1280, height: 720, ratio: '16:9' },
  { id: '16-9-md', name: '16:9 Medium', name_zh: '16:9 中尺寸', width: 1920, height: 1080, ratio: '16:9' },
  { id: '16-9-lg', name: '16:9 Large', name_zh: '16:9 大尺寸', width: 2560, height: 1440, ratio: '16:9' },

  // 2:3
  { id: '2-3-sm', name: '2:3 Small', name_zh: '2:3 小尺寸', width: 800, height: 1200, ratio: '2:3' },
  { id: '2-3-md', name: '2:3 Medium', name_zh: '2:3 中尺寸', width: 1080, height: 1620, ratio: '2:3' },
  { id: '2-3-lg', name: '2:3 Large', name_zh: '2:3 大尺寸', width: 1440, height: 2160, ratio: '2:3' },

  // 3:2
  { id: '3-2-sm', name: '3:2 Small', name_zh: '3:2 小尺寸', width: 1200, height: 800, ratio: '3:2' },
  { id: '3-2-md', name: '3:2 Medium', name_zh: '3:2 中尺寸', width: 1620, height: 1080, ratio: '3:2' },
  { id: '3-2-lg', name: '3:2 Large', name_zh: '3:2 大尺寸', width: 2160, height: 1440, ratio: '3:2' },
];

export const MEDIA_TYPES: MediaTypeOption[] = [
  {
    id: 'video-cover',
    name: 'Video Cover',
    name_zh: '视频封面',
    promptDesc: 'Eye-catching video thumbnail with bold text overlay, high contrast, attention-grabbing composition',
    promptDesc_zh: '醒目的视频缩略图，大字标题叠加，高对比度，吸引眼球的构图'
  },
  {
    id: 'poster',
    name: 'Poster',
    name_zh: '海报',
    promptDesc: 'Professional poster design with clear visual hierarchy, balanced layout, promotional aesthetic',
    promptDesc_zh: '专业海报设计，清晰的视觉层次，平衡的布局，宣传美学'
  },
  {
    id: 'book-page',
    name: 'Book Page',
    name_zh: '书页设计',
    promptDesc: 'Editorial book page layout with elegant typography, generous whitespace, readable text blocks',
    promptDesc_zh: '编辑书页布局，优雅的排版，充足的留白，可读的文本块'
  },
  {
    id: 'social-post',
    name: 'Social Media Post',
    name_zh: '社交媒体',
    promptDesc: 'Social media graphic optimized for engagement, vibrant colors, clear focal point',
    promptDesc_zh: '针对互动优化的社交媒体图形，鲜艳的色彩，清晰的焦点'
  },
  {
    id: 'banner',
    name: 'Banner',
    name_zh: '横幅广告',
    promptDesc: 'Wide banner design with horizontal emphasis, clear call-to-action, brand-focused',
    promptDesc_zh: '宽横幅设计，水平强调，清晰的行动号召，品牌聚焦'
  },
];
