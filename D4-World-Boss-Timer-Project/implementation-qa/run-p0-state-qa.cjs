const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const baseUrl = 'http://localhost:3001/diablo-4-world-boss-timer';
const outDir = path.join(__dirname, 'states');

const states = [
  { name: '01-default-mobile' },
  { name: '02-current-loading-mobile', button: 'Current loading', expect: ['Loading next spawn'] },
  { name: '03-confirmed-mobile', button: 'Confirmed', expect: ['Confirmed', 'Ashava'] },
  { name: '04-needs-verification-mobile', button: 'Needs verification', expect: ['Needs verification'] },
  { name: '05-no-anchor-mobile', button: 'No anchor', expect: ['Schedule anchor needs verification'] },
  { name: '06-no-future-mobile', button: 'No future', expect: ['Schedule anchor needs verification'] },
  { name: '07-expired-mobile', button: 'Expired', expect: ['Checking next World Boss spawn'] },
  { name: '08-announcement-mobile', button: 'Announcement', expect: ['Season update'] },
  { name: '09-stale-mobile', button: 'Stale', expect: ['Stale data'] },
  { name: '10-api-failed-mobile', button: 'API failed', expect: ['Unable to load the next World Boss'] },
  { name: '11-schedule-loading-mobile', button: 'Schedule loading', capture: '#schedule', expect: ['Loading schedule'] },
  { name: '12-schedule-failed-mobile', button: 'Schedule failed', capture: '#schedule', expect: ['Upcoming schedule could not load'] },
  { name: '13-map-loading-mobile', button: 'View Map', capture: '#locations', waitAfterClick: 120, expect: ['Loading map'] },
  { name: '14-map-open-mobile', button: 'View Map', capture: '#locations', waitAfterClick: 850, expect: ['The map loads only after user intent'] },
  { name: '15-map-failed-mobile', button: 'Map failed', capture: '#locations', expect: ['Map could not load'] },
  { name: '16-reminder-default-mobile', button: 'Remind Me', expect: ['Set a World Boss Reminder'] },
  { name: '17-reminder-saved-mobile', button: 'Reminder saved', expect: ['Reminder saved locally'] },
  { name: '18-reminder-unsupported-mobile', button: 'Reminder unsupported', expect: ['Browser notifications are unavailable'] },
  { name: '19-reminder-denied-mobile', button: 'Reminder denied', expect: ['Notifications are blocked'] },
  { name: '20-timezone-failed-mobile', button: 'Timezone failed', expect: ['Timezone detection failed'] },
  { name: '21-report-default-mobile', button: 'Report Wrong Time', expect: ['Report Wrong Time', 'Submit Report'] },
  { name: '22-report-submitted-mobile', button: 'Report submitted', expect: ['Report submitted'] },
  { name: '23-report-error-mobile', button: 'Report error', expect: ['Mock report submission failed'] },
  { name: '24-report-500-limit-mobile', button: 'Report Wrong Time', longNote: true, expect: ['Report note must be 500 characters or fewer'] },
];

function textOf(locator) {
  return locator.innerText().then((value) => value.replace(/\s+/g, ' ').trim());
}

async function getButton(page, name) {
  const button = page.getByRole('button', { name, exact: true });
  const count = await button.count();
  if (count > 0) return button.first();
  return page.getByRole('button', { name, exact: false }).first();
}

async function captureScroll(page, state) {
  if (state.capture) {
    await page.evaluate((selector) => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      const element = document.querySelector(selector);
      if (!element) return;
      const top = Math.max(0, element.getBoundingClientRect().top + window.scrollY - 72);
      window.scrollTo(0, top);
    }, state.capture);
    await page.waitForTimeout(state.name === '13-map-loading-mobile' ? 80 : 350);
    return;
  }

  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(350);
}

async function viewportMetrics(page) {
  return page.evaluate(() => {
    const textOfElement = (element) =>
      (element?.innerText || element?.textContent || '').replace(/\s+/g, ' ').trim();
    const box = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        bottom: Math.round(rect.bottom),
        right: Math.round(rect.right),
        text: textOfElement(element).slice(0, 140),
      };
    };
    const visible = [...document.querySelectorAll('main *')].filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.top < innerHeight &&
        style.display !== 'none' &&
        style.visibility !== 'hidden'
      );
    });
    const overlaps = [];
    for (let i = 0; i < visible.length; i += 1) {
      for (let j = i + 1; j < visible.length; j += 1) {
        const a = visible[i];
        const b = visible[j];
        if (a.contains(b) || b.contains(a)) continue;
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        const overlapX = Math.max(0, Math.min(ar.right, br.right) - Math.max(ar.left, br.left));
        const overlapY = Math.max(0, Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top));
        if (overlapX > 2 && overlapY > 2) {
          overlaps.push({
            a: `${a.tagName.toLowerCase()}.${String(a.className).slice(0, 80)}`,
            b: `${b.tagName.toLowerCase()}.${String(b.className).slice(0, 80)}`,
            aText: textOfElement(a).slice(0, 80),
            bText: textOfElement(b).slice(0, 80),
            overlap: [Math.round(overlapX), Math.round(overlapY)],
          });
        }
      }
    }
    const targets = {
      header: box('.wb-header'),
      title: box('#page-title'),
      timerCard: box('.wb-timer-card'),
      confidence: box('.wb-timer-card .wb-confidence'),
      boss: box('.wb-timer-card h2'),
      countdown: box('.wb-countdown'),
      localTime: box('.wb-timer-meta div:first-child'),
      location: box('.wb-timer-meta div:nth-child(2)'),
      remind: box('.wb-timer-card .wb-primary-button'),
      map: box('.wb-timer-card .wb-secondary-button'),
      reminderPanel: box('.wb-reminder-panel'),
      dialog: box('.wb-dialog'),
    };
    return {
      viewport: {
        width: innerWidth,
        height: innerHeight,
        scrollX,
        scrollY,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      },
      targets,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      firstViewportPass: Boolean(
        targets.boss &&
          targets.countdown &&
          targets.localTime &&
          targets.location &&
          targets.confidence &&
          targets.remind &&
          targets.remind.bottom <= 640,
      ),
      nonNestedOverlaps: overlaps.slice(0, 20),
      h1Count: document.querySelectorAll('h1').length,
      mapLoadedBeforeIntent: Boolean(
        document.querySelector('.wb-map-panel') || document.querySelector('.wb-map-placeholder'),
      ),
      scheduleRowsVisible: document.querySelectorAll('.wb-schedule-row').length,
      devControlsVisible: Boolean(document.querySelector('.wb-dev-panel')),
    };
  });
}

async function runState(browser, state) {
  const page = await browser.newPage({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
  if (state.name === '17-reminder-saved-mobile') {
    await page.context().grantPermissions(['notifications'], { origin: baseUrl });
  }
  const consoleMessages = [];
  page.on('console', (message) => {
    if (['warning', 'error'].includes(message.type())) {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });
  await page.goto(baseUrl, { waitUntil: 'load' });
  await page.waitForTimeout(300);

  if (state.button) {
    const button = await getButton(page, state.button);
    await button.click();
    await page.waitForTimeout(state.waitAfterClick ?? 450);
  }

  if (state.afterOpenButton) {
    const nestedButton = await getButton(page, state.afterOpenButton);
    await nestedButton.click();
    await page.waitForTimeout(state.waitAfterClick ?? 650);
  }

  if (state.longNote) {
    const textarea = page.locator('textarea').first();
    await textarea.fill('x'.repeat(501));
    await (await getButton(page, 'Submit Report')).click();
    await page.waitForTimeout(300);
  }

  await captureScroll(page, state);

  const bodyText = await textOf(page.locator('body'));
  const metrics = await viewportMetrics(page);
  const screenshot = path.join(outDir, `${state.name}.png`);
  await page.screenshot({ path: screenshot, fullPage: false });
  await page.close();

  return {
    state: state.name,
    screenshot,
    expectedFound: (state.expect || []).map((expected) => ({
      expected,
      found: bodyText.includes(expected),
    })),
    metrics,
    consoleMessages,
  };
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const state of states) {
      results.push(await runState(browser, state));
    }

    const desktop = await browser.newPage({ viewport: { width: 1228, height: 760 } });
    await desktop.goto(baseUrl, { waitUntil: 'load' });
    await desktop.screenshot({ path: path.join(__dirname, 'p0-desktop-1228x760.png'), fullPage: false });
    const desktopMetrics = await viewportMetrics(desktop);
    await desktop.close();

    const tablet = await browser.newPage({ viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true });
    await tablet.goto(baseUrl, { waitUntil: 'load' });
    await tablet.screenshot({ path: path.join(__dirname, 'p0-tablet-768x1024.png'), fullPage: false });
    const tabletMetrics = await viewportMetrics(tablet);
    await tablet.close();

    const negativeCheck = await browser.newPage({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
    await negativeCheck.goto(baseUrl, { waitUntil: 'load' });
    const firstCountdown = await textOf(negativeCheck.locator('.wb-countdown'));
    await negativeCheck.waitForTimeout(1250);
    const secondCountdown = await textOf(negativeCheck.locator('.wb-countdown'));
    await negativeCheck.close();

    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      stateResults: results,
      responsiveResults: { desktopMetrics, tabletMetrics },
      countdownCheck: {
        firstCountdown,
        secondCountdown,
        changed: firstCountdown !== secondCountdown,
        negativeSeen: /-/.test(`${firstCountdown} ${secondCountdown}`),
      },
      scheduleStateCheck: {
        loadingRowsVisible:
          results.find((result) => result.state === '11-schedule-loading-mobile')?.metrics
            .scheduleRowsVisible ?? null,
        errorRowsVisible:
          results.find((result) => result.state === '12-schedule-failed-mobile')?.metrics
            .scheduleRowsVisible ?? null,
      },
    };

    await fs.writeFile(path.join(__dirname, 'p0-state-results.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      states: results.length,
      failures: results.flatMap((result) =>
        result.expectedFound.filter((item) => !item.found).map((item) => `${result.state}: ${item.expected}`),
      ),
      firstViewportPass: results.find((result) => result.state === '01-default-mobile')?.metrics.firstViewportPass,
      countdownCheck: report.countdownCheck,
      scheduleStateCheck: report.scheduleStateCheck,
      desktopHorizontalOverflow: desktopMetrics.horizontalOverflow,
      tabletHorizontalOverflow: tabletMetrics.horizontalOverflow,
      resultFile: path.join(__dirname, 'p0-state-results.json'),
    }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
