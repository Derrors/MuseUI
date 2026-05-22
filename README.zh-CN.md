# MuseUI

[English](./README.md)

[![GuanTou Lab](https://world.guantou.site/badge.svg?theme=dark&accent=red&lang=zh&size=sm)](https://world.guantou.site/)

MuseUI 是一个纯浏览器运行的 AI 界面与图像设计生成器。它可以根据提示词和参考图，帮助你创建 UI 原型、社交媒体图片、封面、信息图、贴纸、Logo，以及其他视觉草稿。

这个应用是一个静态 Vite + React SPA。它没有后端、没有登录系统，也没有服务器数据库。用户需要在浏览器设置中配置自己的 AI API Key，这些 Key 会保存在用户本地浏览器中。

## 功能

- 文本生成 UI 原型图
- 支持 Gemini 和 OpenAI-compatible endpoint 的多供应商 API 配置
- 带生成画板的画布工作区
- 支持参考图、颜色和布局输入
- 支持封面、信息图、漫画、幻灯片、Logo、贴纸等技能模式
- 使用本地 IndexedDB 保存项目和生成历史
- 双语界面：英文和中文

## 非目标

- MuseUI 不提供托管 AI API、内置 API Key 或后端代理。
- MuseUI 不会把项目、生成图片或 API 设置上传到 MuseUI 服务器。
- MuseUI 与设计模板中提到的任何 AI 供应商或品牌没有关联、背书或赞助关系。

## 隐私模型

- API Key 存储在浏览器 localStorage 中。
- 项目和生成历史存储在本地 IndexedDB 中。
- 这个应用不包含任何后端服务。
- 构建时不需要 API Key。

## 快速开始

### 前置要求

- Node.js 20+
- npm

### 安装

```bash
npm install
```

### 本地运行

```bash
npm run dev
```

开发服务器默认运行在 `http://localhost:3003`。

### 配置 AI API

打开应用后，使用右上角的 API 设置按钮进行配置。

推荐的官方 endpoint：

- Gemini：Base URL 留空即可使用官方 API，也可以填写 `https://generativelanguage.googleapis.com`
- OpenAI text：`https://api.openai.com/v1/chat/completions`
- OpenAI image：`https://api.openai.com/v1/images/generations`

这个应用设计上通过浏览器 UI 进行配置。`.env.example` 只是用于本地开发备注；构建时不需要 API Key。

## 品牌和模板说明

部分设计模板会提到第三方品牌名称或视觉系统，作为风格参考。这些引用仅用于描述。MuseUI 与这些品牌没有关联，用户需要自行确保生成结果符合相关商标、版权、平台和使用规则。

更多第三方引用说明见 [NOTICE.md](./NOTICE.md)。

## 脚本

```bash
npm run dev
npm run build
npm run preview
npx vitest run
```

## 安全

不要提交真实 API Key、数据库 URL、Webhook URL 或其他凭据。漏洞报告方式见 [SECURITY.md](./SECURITY.md)。

## 贡献

欢迎贡献。请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 许可证

MIT。详见 [LICENSE](./LICENSE)。
