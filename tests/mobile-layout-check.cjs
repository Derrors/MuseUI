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

async function runChecks(url) {
  const browser = await launchChromium();

  try {
    {
      const { context, page } = await createPage(browser, url, { width: 375, height: 812 }, true);
      const state = await assertNoHorizontalOverflow(page, 'mobile config');
      assert(state.bottomNav && state.bottomNav.display !== 'none', 'mobile config: bottom navigation is not visible', state);
      assert(!state.canvas || state.canvas.display === 'none' || state.canvas.width === 0, 'mobile config: canvas should not occupy the config pane', state);

      await page.getByRole('button', { name: /画布|Canvas/ }).click();
      const canvasState = await assertNoHorizontalOverflow(page, 'mobile canvas');
      assert(canvasState.canvas && canvasState.canvas.width >= 360, 'mobile canvas: canvas does not fill the viewport', canvasState);

      await page.getByLabel(/API|Open API|打开 API/).click();
      await assertNoHorizontalOverflow(page, 'mobile API modal');
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
