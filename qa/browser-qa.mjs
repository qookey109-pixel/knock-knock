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
  assert(await page.locator('.mode').count() === 7, `${name}: expected seven modes`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 1, `${name}: horizontal overflow detected (${overflow}px)`);
  await assertA11y(page, `${name} home`);

  // Daily Training contract: the public session must run all seven games in sequence.
  assert((await page.locator('#home .hero p').innerText()).includes('完整跑完 7 個'), `${name}: home copy must describe the seven-game session`);
  await page.locator('#dailyBtn').click();
  await page.locator('#math.active').waitFor();
  assert((await page.locator('#math .gamehead h2').innerText()) === '快速心算', `${name}: Daily Training must start with Quick Math`);
  await page.locator('.back:visible').click();


  // Math: solve one generated question and verify score increments.
  await page.locator('[data-mode="math"]').click();
  const problem = await page.locator('#mathProblem').innerText();
  const answer = solveMath(problem);
  await page.locator('#mathAnswer').fill(String(answer));
  await page.locator('#mathSubmit').click();
  await page.waitForFunction(() => document.getElementById('mathCorrect')?.textContent === '1');
  await assertA11y(page, `${name} math`);

  // Memory: capture the shown digits, then submit the same digits after they disappear.
  await page.locator('.back:visible').click();
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
  await page.locator('.back:visible').click();
  await page.locator('[data-mode="logic"]').click();
  const choices = page.locator('#logicChoices .choice');
  assert(await choices.count() === 3, `${name}: puzzle 1 should have three choices`);
  await choices.nth(0).click();
  await page.locator('#logicSubmit').click();
  const feedback = await page.locator('#logicFeedback').innerText();
  assert(feedback.includes('正確'), `${name}: first logic puzzle expected 阿明 to be correct`);
  await assertA11y(page, `${name} logic`);

  // Executive function: follow the visible rule and verify the first answer is accepted.
  await page.locator('.back:visible').click();
  await page.locator('[data-mode="executive"]').click();
  const rule = (await page.locator('#execRule').innerText()).trim();
  const value = Number((await page.locator('#execNumber').innerText()).trim());
  assert(Number.isFinite(value), `${name}: executive stimulus should be numeric`);
  let side;
  if (rule.includes('奇數 / 偶數')) side = value % 2 === 1 ? 'left' : 'right';
  else if (rule.includes('小於 5 / 大於 5')) side = value < 5 ? 'left' : 'right';
  else throw new Error(`${name}: unknown executive rule: ${rule}`);
  await page.locator(side === 'left' ? '#execLeft' : '#execRight').click();
  await page.waitForFunction(() => document.getElementById('execCorrect')?.textContent === '1');
  await assertA11y(page, `${name} executive`);

  // Schulte
  await page.locator('.back:visible').click();
  await page.locator('[data-mode="schulte"]').click();
  assert(await page.locator('#schulteGrid .schulte-cell').count() === 25, `${name}: Schulte grid should contain 25 cells`);
  await page.locator('#schulteGrid .schulte-cell').filter({ hasText: /^1$/ }).click();
  await page.waitForFunction(() => document.getElementById('schulteNext')?.textContent === '2');
  await assertA11y(page, `${name} schulte`);

  // Stroop
  await page.locator('.back:visible').click();
  await page.locator('[data-mode="stroop"]').click();
  const stroopColor = await page.locator('#stroopWord').getAttribute('data-color');
  assert(['red','blue','green','yellow'].includes(stroopColor), `${name}: invalid Stroop color`);
  await page.locator(`#stroopChoices [data-color="${stroopColor}"]`).click();
  await page.waitForFunction(() => document.getElementById('stroopCorrect')?.textContent === '1');
  await assertA11y(page, `${name} stroop`);

  // 表裡不一
  await page.locator('.back:visible').click();
  await page.locator('[data-mode="odd"]').click();
  assert(await page.locator('#oddGrid .odd-cell').count() === 16, `${name}: odd grid should contain 16 cells`);
  assert(await page.locator('#oddGrid .odd-cell[data-odd="true"]').count() === 1, `${name}: odd grid must have exactly one mismatch`);
  await page.locator('#oddGrid .odd-cell[data-odd="true"]').click();
  await page.waitForFunction(() => document.getElementById('oddCorrect')?.textContent === '1');
  await assertA11y(page, `${name} odd`);

  await context.close();
}

async function runReducedMotion(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/adult-brain-training/', { waitUntil: 'networkidle' });
  await page.locator('[data-mode="logic"]').click();
  await page.locator('#logic.active').waitFor();
  const duration = await page.evaluate(() => getComputedStyle(document.querySelector('.mode')).transitionDuration);
  assert(duration === '0s' || duration === '1e-06s' || duration === '0.001ms', `reduced motion transition not reduced: ${duration}`);
  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await runViewport(browser, { width: 390, height: 844 }, 'mobile');
  await runViewport(browser, { width: 1280, height: 900 }, 'desktop');
  await runReducedMotion(browser);
  console.log('browser-qa: PASS — 7 games, mobile + desktop, accessibility, and reduced-motion checks passed.');
} finally {
  await browser.close();
}
