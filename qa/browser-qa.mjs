import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function solveMath(text) {
  const m = text.trim().match(/^(\d+)\s*([+\-×÷])\s*(\d+)$/);
  if (!m) throw new Error('Could not parse math problem: ' + text);
  const a = Number(m[1]), b = Number(m[3]);
  if (m[2] === '+') return a + b;
  if (m[2] === '-') return a - b;
  if (m[2] === '×') return a * b;
  if (m[2] === '÷') return a / b;
}

async function assertA11y(page, label) {
  const result = await new AxeBuilder({ page }).analyze();
  const blocking = result.violations.filter(v => ['critical','serious'].includes(v.impact));
  if (blocking.length) {
    const details = blocking.map(v => `${v.id}: ${v.help}`).join('\n');
    throw new Error(`Accessibility violations on ${label}:\n${details}`);
  }
}

async function runViewport(browser, viewport, name) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/adult-brain-training/', { waitUntil: 'networkidle' });

  assert(await page.title() === '大人的腦部鍛鍊', `${name}: wrong page title`);
  assert(await page.locator('.mode').count() === 3, `${name}: expected three modes`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 1, `${name}: horizontal overflow detected (${overflow}px)`);
  await assertA11y(page, `${name} home`);

  // Math: solve one generated question and verify score increments.
  await page.locator('[data-mode="math"]').click();
  const problem = await page.locator('#mathProblem').innerText();
  const answer = solveMath(problem);
  await page.locator('#mathAnswer').fill(String(answer));
  await page.locator('#mathSubmit').click();
  await page.waitForFunction(() => document.getElementById('mathCorrect')?.textContent === '1');
  await assertA11y(page, `${name} math`);

  // Memory: capture the shown digits, then submit the same digits after they disappear.
  await page.locator('.back').first().click();
  await page.locator('[data-mode="memory"]').click();
  await page.locator('#memoryStart').click();
  const shown = (await page.locator('#memoryNumber').innerText()).trim();
  assert(/^\d{4}$/.test(shown), `${name}: first memory round should show 4 digits`);
  await page.locator('#memoryEntry').waitFor({ state: 'visible', timeout: 4000 });
  await page.locator('#memoryAnswer').fill(shown);
  await page.locator('#memorySubmit').click();
  await page.waitForFunction(() => document.getElementById('memoryNumber')?.textContent === '正確');
  await assertA11y(page, `${name} memory`);

  // Logic: answer the first formally verified puzzle.
  await page.locator('.back').first().click();
  await page.locator('[data-mode="logic"]').click();
  const choices = page.locator('#logicChoices .choice');
  assert(await choices.count() === 3, `${name}: puzzle 1 should have three choices`);
  await choices.nth(0).click();
  await page.locator('#logicSubmit').click();
  const feedback = await page.locator('#logicFeedback').innerText();
  assert(feedback.includes('正確'), `${name}: first logic puzzle expected 阿明 to be correct`);
  await assertA11y(page, `${name} logic`);

  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await runViewport(browser, { width: 390, height: 844 }, 'mobile');
  await runViewport(browser, { width: 1280, height: 900 }, 'desktop');
  console.log('browser-qa: PASS — mobile + desktop smoke flows and accessibility checks passed.');
} finally {
  await browser.close();
}
