const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');

async function launchChromium() {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    const cacheDir = path.join(os.homedir(), '.cache', 'ms-playwright');
    const candidates = [];

    if (fs.existsSync(cacheDir)) {
      const dirs = fs.readdirSync(cacheDir).sort().reverse();
      for (const dir of dirs) {
        candidates.push(path.join(cacheDir, dir, 'chrome-headless-shell-linux64', 'chrome-headless-shell'));
        candidates.push(path.join(cacheDir, dir, 'chrome-linux64', 'chrome'));
      }
    }

    for (const executablePath of candidates) {
      if (fs.existsSync(executablePath)) {
        return chromium.launch({
          executablePath,
          headless: true,
          args: ['--no-sandbox'],
        });
      }
    }

    throw error;
  }
}

async function withServer(run) {
  const { createServer } = await import('vite');
  const server = await createServer({
    root: ROOT,
    configFile: path.join(ROOT, 'vite.config.ts'),
    logLevel: 'silent',
    server: {
      host: '127.0.0.1',
      port: 0,
    },
  });

  await server.listen();
  const url = server.resolvedUrls.local[0];

  try {
    await run(url);
  } finally {
    await server.close();
  }
}

async function createPage(browser, url, viewport, isMobile = false) {
  const context = await browser.newContext({
    viewport,
    isMobile,
    hasTouch: isMobile,
  });
  await context.addInitScript(() => {
    localStorage.setItem('muse-ui-first-use-tips-dismissed', 'true');
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  return { context, page };
}

async function getLayoutState(page) {
  return page.evaluate(() => {
    const rectFor = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
        display: style.display,
      };
    };

    const overflowers = [...document.querySelectorAll('body *')]
      .map((el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return {
          tag: el.tagName,
          text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
          x: Math.round(rect.x),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          right: Math.round(rect.right),
          display: style.display,
          visibility: style.visibility,
        };
      })
      .filter((item) => (
        item.display !== 'none' &&
        item.visibility !== 'hidden' &&
        item.width > 0 &&
        item.height > 0 &&
        (item.right > window.innerWidth + 1 || item.x < -1)
      ))
      .slice(0, 10);

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      scrollWidth: document.documentElement.scrollWidth,
      header: rectFor('header'),
      canvas: rectFor('#main-canvas-area'),
      bottomNav: rectFor('nav[aria-label]'),
      overflowers,
    };
  });
}

function assert(condition, message, details) {
  if (!condition) {
    const suffix = details ? `\n${JSON.stringify(details, null, 2)}` : '';
    throw new Error(`${message}${suffix}`);
  }
}

async function assertNoHorizontalOverflow(page, label) {
  const state = await getLayoutState(page);
  assert(state.scrollWidth <= state.viewport.width, `${label}: document scroll width exceeds viewport`, state);
  assert(state.overflowers.length === 0, `${label}: visible elements overflow horizontally`, state.overflowers);
  return state;
}

async function assertApiModalUsesPageScroll(page) {
  const state = await page.evaluate(() => {
    const body = document.querySelector('[data-api-config-body]');
    const lists = [...document.querySelectorAll('[data-api-list]')].map((el) => {
      const style = window.getComputedStyle(el);
      return {
        role: el.getAttribute('data-api-list'),
        overflowY: style.overflowY,
        clientHeight: Math.round(el.clientHeight),
        scrollHeight: Math.round(el.scrollHeight),
      };
    });
    const guide = document.querySelector('[data-api-guide]');
    const guideStyle = guide ? window.getComputedStyle(guide) : null;
    const bodyStyle = body ? window.getComputedStyle(body) : null;

    return {
      body: body ? {
        overflowY: bodyStyle?.overflowY,
        clientHeight: Math.round(body.clientHeight),
        scrollHeight: Math.round(body.scrollHeight),
      } : null,
      guide: guide ? {
        overflowY: guideStyle?.overflowY,
        clientHeight: Math.round(guide.clientHeight),
        scrollHeight: Math.round(guide.scrollHeight),
      } : null,
      lists,
      text: document.body.textContent || '',
    };
  });

  assert(state.body, 'mobile API modal: scroll body was not found', state);
  assert(state.body.overflowY === 'auto', 'mobile API modal: body should own vertical scrolling', state);
  assert(state.lists.length === 1 && state.lists[0].role === 'profiles', 'mobile API modal: profile list was not found', state);
  assert(
    state.lists.every((item) => item.overflowY === 'visible' && item.scrollHeight <= item.clientHeight + 1),
    'mobile API modal: API config lists should expand instead of becoming nested scrollers',
    state,
  );
  assert(
    !state.guide || state.guide.overflowY === 'visible',
    'mobile API modal: guide panel should expand instead of becoming a nested scroller',
    state,
  );
  assert(
    !/备选：中转站|Fallback: Proxies|中转站使用指南/.test(state.text),
    'mobile API modal: fallback proxy recommendation section should be removed',
    state,
  );
}

async function assertMobileApiEntryIsReadable(page) {
  const state = await page.evaluate(() => {
    const api = document.querySelector('[data-mobile-api-entry]');
    const more = document.querySelector('header button[aria-label="打开更多操作"], header button[aria-label="Open more actions"]');
    const rectFor = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        text: (el.textContent || '').trim().replace(/\s+/g, ' '),
        x: Math.round(rect.x),
        width: Math.round(rect.width),
        right: Math.round(rect.right),
        height: Math.round(rect.height),
      };
    };
    return {
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      api: rectFor(api),
      more: rectFor(more),
    };
  });

  assert(state.api, 'mobile header: API entry is missing', state);
  assert(state.api.text.includes('API'), 'mobile header: API entry label is not visible', state);
  assert(state.api.width >= 56, 'mobile header: API entry is too narrow to be readable', state);
  assert(state.api.right <= state.viewportWidth - 44, 'mobile header: API entry is clipped or overlaps the menu button', state);
  assert(state.more && state.more.right <= state.viewportWidth, 'mobile header: menu button overflows viewport', state);

  await page.getByLabel(/更多|more/i).click();
  const menuState = await page.evaluate(() => {
    const item = document.querySelector('[data-mobile-menu-api-entry]');
    if (!item) return null;
    const rect = item.getBoundingClientRect();
    return {
      text: (item.textContent || '').trim().replace(/\s+/g, ' '),
      x: Math.round(rect.x),
      width: Math.round(rect.width),
      right: Math.round(rect.right),
      viewportWidth: window.innerWidth,
    };
  });

  assert(menuState, 'mobile menu: API settings entry is missing', menuState);
  assert(/API|Key/.test(menuState.text), 'mobile menu: API settings entry text is not readable', menuState);
  assert(menuState.x >= 0 && menuState.right <= menuState.viewportWidth, 'mobile menu: API settings entry is clipped', menuState);
}

async function assertHeaderPromoLinksAreRemoved(page) {
  const state = await page.evaluate(() => {
    const links = [...document.querySelectorAll('header a')].map((link) => ({
      href: link.getAttribute('href') || '',
      text: (link.textContent || '').trim().replace(/\s+/g, ' '),
      label: link.getAttribute('aria-label') || '',
    }));
    return {
      links,
      hasGuantouLab: links.some((link) => link.href.includes('world.guantou.site') || /GuanTou|罐头/.test(link.text + link.label)),
      hasStickerPromo: links.some((link) => link.href.includes('sticker.guantou.site') || /表情包贴纸|meme stickers/i.test(link.text + link.label)),
    };
  });

  assert(!state.hasGuantouLab, 'header: GuanTou Lab promo link should be removed', state);
  assert(!state.hasStickerPromo, 'header: sticker promo link should be removed', state);
}

async function runChecks(url) {
  const browser = await launchChromium();

  try {
    {
      const { context, page } = await createPage(browser, url, { width: 375, height: 812 }, true);
      const state = await assertNoHorizontalOverflow(page, 'mobile config');
      assert(state.bottomNav && state.bottomNav.display !== 'none', 'mobile config: bottom navigation is not visible', state);
      assert(!state.canvas || state.canvas.display === 'none' || state.canvas.width === 0, 'mobile config: canvas should not occupy the config pane', state);
      await assertMobileApiEntryIsReadable(page);

      await page.getByRole('button', { name: /画布|Canvas/ }).click();
      const canvasState = await assertNoHorizontalOverflow(page, 'mobile canvas');
      assert(canvasState.canvas && canvasState.canvas.width >= 360, 'mobile canvas: canvas does not fill the viewport', canvasState);

      await page.getByLabel(/API|Open API|打开 API/).click();
      await assertNoHorizontalOverflow(page, 'mobile API modal');
      await assertApiModalUsesPageScroll(page);
      await context.close();
    }

    {
      const { context, page } = await createPage(browser, url, { width: 700, height: 812 }, true);
      await assertNoHorizontalOverflow(page, 'wide mobile header');
      await assertHeaderPromoLinksAreRemoved(page);
      await context.close();
    }

    {
      const { context, page } = await createPage(browser, url, { width: 375, height: 812 }, true);
      await page.locator('button[title="项目管理"]').click();
      await assertNoHorizontalOverflow(page, 'mobile project manager');
      await context.close();
    }

    {
      const { context, page } = await createPage(browser, url, { width: 375, height: 812 }, true);
      await page.mouse.wheel(0, 700);
      await page.getByRole('button', { name: /未选择|None|未选/ }).first().click({ force: true });
      await assertNoHorizontalOverflow(page, 'mobile template selector');
      const topText = await page.evaluate(() => document.elementFromPoint(20, 20)?.textContent || '');
      assert(/选择|Select|Template/i.test(topText), 'mobile template selector: modal is not covering the viewport header', { topText });
      await context.close();
    }

    {
      const { context, page } = await createPage(browser, url, { width: 1440, height: 900 }, false);
      const state = await assertNoHorizontalOverflow(page, 'desktop shell');
      assert(state.canvas && state.canvas.x >= 350 && state.canvas.width >= 900, 'desktop shell: canvas/sidebar split regressed', state);
      assert(!state.bottomNav || state.bottomNav.display === 'none' || state.bottomNav.width === 0, 'desktop shell: mobile bottom navigation should be hidden', state);
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

withServer(runChecks)
  .then(() => {
    console.log('mobile layout checks passed');
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
