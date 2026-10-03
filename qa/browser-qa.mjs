import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function solveMath(text) {
  const tokens = text.trim().split(/\s+/);
  if (tokens.length < 3 || tokens.length % 2 === 0) throw new Error('Could not parse math problem: ' + text);
  let total = 0;
  let sign = 1;
  let term = Number(tokens[0]);
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i], value = Number(tokens[i + 1]);
    if (op === '×') term *= value;
    else if (op === '÷') term /= value;
    else {
      total += sign * term;
      sign = op === '+' ? 1 : -1;
      term = value;
    }
  }
  return total + sign * term;
}

async function answerCurrentMath(page) {
  const problem = (await page.locator('#mathProblem').innerText()).trim();
  const answer = String(solveMath(problem));
  await page.keyboard.press('Delete');
  for (const digit of answer) await page.keyboard.press(digit);
  await page.keyboard.press('Enter');
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
  assert((await page.locator('meta[name="color-scheme"]').getAttribute('content')) === 'light', `${name}: BRAIN/7 should use the light color scheme`);
  assert((await page.locator('meta[name="application-name"]').getAttribute('content')) === 'BRAIN/7', `${name}: application identity metadata is missing`);
  assert((await page.locator('link[rel="canonical"]').getAttribute('href')) === 'https://qookey109-pixel.github.io/quick-math-brain-training/adult-brain-training/', `${name}: canonical URL should target the public BRAIN/7 page`);
  assert((await page.locator('link[rel="icon"]').getAttribute('href')) === './brain7-mark.svg', `${name}: BRAIN/7 favicon should be declared`);
  assert((await page.locator('link[rel="manifest"]').getAttribute('href')) === './manifest.webmanifest', `${name}: web app manifest should be declared`);
  assert((await page.locator('meta[property="og:title"]').getAttribute('content')) === 'BRAIN/7｜大人的腦部鍛鍊', `${name}: Open Graph title should expose the product identity`);
  assert((await page.locator('#soundBtn').getAttribute('aria-pressed')) === 'false', `${name}: sound toggle should expose its initial state`);
  const publicIdentity = await page.evaluate(async () => {
    const [manifestResponse, iconResponse] = await Promise.all([fetch('./manifest.webmanifest'), fetch('./brain7-mark.svg')]);
    const manifest = manifestResponse.ok ? await manifestResponse.json() : null;
    return {
      manifestOk: manifestResponse.ok,
      iconOk: iconResponse.ok,
      shortName: manifest && manifest.short_name,
      iconSrc: manifest && manifest.icons && manifest.icons[0] && manifest.icons[0].src
    };
  });
  assert(publicIdentity.manifestOk && publicIdentity.shortName === 'BRAIN/7', `${name}: manifest should load and identify BRAIN/7`);
  assert(publicIdentity.iconOk && publicIdentity.iconSrc === './brain7-mark.svg', `${name}: identity icon should load and be linked from the manifest`);
  assert(await page.locator('.mode').count() === 7, `${name}: expected seven modes`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 1, `${name}: horizontal overflow detected (${overflow}px)`);
  await assertA11y(page, `${name} home`);
  await page.screenshot({path:'/tmp/brain7-chill-home-'+name+'.png',fullPage:true});

  // Home interactive circuit preview
  assert(await page.locator('[data-preview-mode]').count() === 7, `${name}: expected seven circuit preview controls`);
  await page.locator('[data-preview-mode="schulte"]').click();
  assert((await page.locator('#previewIndex').innerText()).trim() === '05', `${name}: preview index should switch to 05`);
  assert((await page.locator('#previewLabel').innerText()).trim() === 'SEARCH', `${name}: preview label should switch to SEARCH`);
  assert((await page.locator('#previewTitle').innerText()).trim() === '舒爾特方格', `${name}: preview title should switch to Schulte`);
  await page.locator('#previewPlay').click();
  await page.locator('#schulte.active').waitFor();
  await page.locator('.back:visible').click();
  await page.locator('#home.active').waitFor();
  await page.locator('[data-preview-mode="math"]').click();
  const homePreview = page.locator('#homePreview');
  await homePreview.focus();
  await homePreview.press('ArrowRight');
  await page.waitForFunction(() => document.getElementById('previewIndex')?.textContent.trim() === '02');
  assert((await page.locator('#previewIndex').innerText()).trim() === '02', `${name}: keyboard preview should advance to 02`);
  await page.locator('[data-preview-mode="math"]').click();


  // Daily Training contract: the public session must run all seven games in sequence.
  assert((await page.locator('#home .hero p:not(.session-info)').innerText()).includes('7 個小遊戲'), `${name}: home copy must describe the seven-game session`);
  await page.locator('#dailyBtn').click();
  await page.locator('#math.active').waitFor();
  assert((await page.locator('#math .gamehead h2').innerText()) === '快速心算', `${name}: Daily Training must start with Quick Math`);
  await page.locator('.back:visible').click();


  // Math: root Quick Math rules — 60 sec per level, 8 correct to advance, score + streak.
  await page.locator('[data-mode="math"]').click();
  // Full-screen radial transition should exist during animated entry.
  assert(await page.locator('#transitionBurst .burst-rays').count() === 0, `${name}: repeat entry should skip the full-screen burst`);
  await page.locator('#math.active').waitFor();
  assert((await page.locator('#mathTime').innerText()).trim() === '60', `${name}: Quick Math should start each level at 60 seconds`);
  assert((await page.locator('#mathLevelMark').innerText()).trim() === 'LV 1 · 0/8', `${name}: Quick Math should require 8 correct answers per level`);
  assert(await page.locator('#mathAnswer').getAttribute('readonly') !== null, `${name}: Quick Math answer display should be readonly so mobile soft keyboards do not open`);
  assert((await page.locator('#mathAnswer').getAttribute('inputmode')) === 'none', `${name}: Quick Math should explicitly disable the mobile soft keyboard`);
  await page.keyboard.press('Numpad1');
  await page.keyboard.press('Numpad2');
  assert((await page.locator('#mathAnswer').inputValue()) === '12', `${name}: physical numpad digits should enter answers`);
  await page.keyboard.press('Backspace');
  assert((await page.locator('#mathAnswer').inputValue()) === '1', `${name}: Backspace should delete one digit`);
  await page.keyboard.press('Delete');
  assert((await page.locator('#mathAnswer').inputValue()) === '', `${name}: Delete should clear the answer`);
  for (let i = 1; i <= 8; i++) {
    await answerCurrentMath(page);
    if (i < 8) {
      await page.waitForFunction(n => document.getElementById('mathLevelMark')?.textContent === 'LV 1 · ' + n + '/8', i);
    }
  }
  await page.waitForFunction(() => document.getElementById('mathLevelMark')?.textContent === 'LV 2 · 0/8');
  await page.waitForFunction(() => !document.getElementById('mathProblem')?.textContent.startsWith('LEVEL'));
  assert((await page.locator('#mathPlayed').innerText()).trim() === '8', `${name}: math should count played questions without a score`);
  assert(await page.locator('#mathScore').count() === 0, `${name}: numeric score must be removed`);
  assert((await page.locator('#mathStreak').innerText()).trim() === '8', `${name}: Quick Math streak should track consecutive correct answers`);
  const source = await page.locator('html').evaluate(el => el.innerHTML);
  assert(source.includes("if(lv===5)") && source.includes("' × '+b+' + '+c1"), `${name}: LV5+ must include multi-step arithmetic`);
  assert(source.includes("if(lv===9)") && source.includes("a=rand(1000,1999)"), `${name}: LV9 must include four-digit arithmetic`);
  assert(source.includes("MATH_MAX_LEVEL=10"), `${name}: Quick Math should cap at LV10`);
  assert(source.includes('#math{--chapter:#ff6b4a}') && source.includes('#odd{--chapter:#a78bfa}'), `${name}: game screens should expose chapter colors`);
  await assertA11y(page, `${name} math`);

  // Memory: 10 rounds with fixed exposure time; difficulty rises only by digit count.
  await page.locator('.back:visible').click();
  await page.locator('[data-mode="memory"]').click();
  await page.locator('#memory.active').waitFor();
  assert((await page.locator('#memoryRoundPill').innerText()).trim() === '1 / 10', `${name}: memory should expose a 10-round progression`);
  await page.locator('#memoryStart').click();
  const shown = (await page.locator('#memoryNumber').innerText()).trim();
  assert(/^\d{4}$/.test(shown), `${name}: first memory round should show 4 digits`);
  await page.locator('#memoryEntry').waitFor({ state: 'visible', timeout: 7000 });
  assert((await page.locator('#memoryAnswerTimer').innerText()).includes('作答'), `${name}: memory should show a visible answer countdown`);
  await page.locator('#memoryAnswer').fill(shown);
  await page.locator('#memorySubmit').click();
  await page.waitForFunction(() => document.getElementById('memoryNumber')?.textContent === '正確');
  const memorySource = await page.locator('html').evaluate(el => el.innerHTML);
  assert(memorySource.includes('MEMORY_SHOW_MS=5000'), `${name}: memory exposure time should stay fixed at 5 seconds`);
  assert(memorySource.includes('MEMORY_ANSWER_MS=10000'), `${name}: memory answer window should be 10 seconds`);
  assert(memorySource.includes('{digits:9,points:9}') && !memorySource.includes('{digits:10,points:10}'), `${name}: memory should cap at 9 digits`);
  assert(memorySource.includes('{digits:4,points:4},\n    {digits:4,points:4}') && memorySource.includes('{digits:7,points:7},\n    {digits:7,points:7}'), `${name}: memory progression should repeat early difficulty steps`);
  assert(!memorySource.includes("mode:'mask'") && !memorySource.includes("mode:'reverse'"), `${name}: memory difficulty should not depend on MASK or REVERSE modes`);
  await assertA11y(page, `${name} memory`);

  // Logic: first generated puzzle is an ordering template with a formally unique middle person.
  await page.locator('.back:visible').click();
  await page.locator('[data-mode="logic"]').click();
  await page.locator('#logic.active').waitFor();
  assert((await page.locator('#logicPill').innerText()).includes('1 / 10 · 排序'), `${name}: logic should start a 10-question generated session`);
  const logicClueTexts = await page.locator('#logicClues .clue').allInnerTexts();
  assert(logicClueTexts.length === 2, `${name}: first ordering puzzle should have two clues`);
  const firstClue = logicClueTexts[0].match(/^(.+) 在 (.+) 前面。$/);
  const secondClue = logicClueTexts[1].match(/^(.+) 在 (.+) 後面。$/);
  assert(firstClue && secondClue && firstClue[2] === secondClue[2], `${name}: ordering clues should identify one middle person`);
  const middlePerson = firstClue[2];
  const logicChoices = page.locator('#logicChoices .choice');
  assert(await logicChoices.count() === 3, `${name}: ordering puzzle should have three choices`);
  assert((await page.locator('#logicTimer').innerText()).trim().endsWith('秒'), `${name}: logic should show a visible answer timer`);
  const logicSource = await page.locator('html').evaluate(el => el.innerHTML);
  assert(logicSource.includes('LOGIC_ANSWER_MS=20000'), `${name}: logic questions should have a 20-second answer window`);
  assert(!logicSource.includes('正確答案：') && !logicSource.includes("q.explain"), `${name}: logic should not display answer explanations after submission`);
  await logicChoices.filter({ hasText: new RegExp('^' + middlePerson + '$') }).click();
  await page.locator('#logicSubmit').click();
  await page.waitForFunction(() => document.getElementById('logicCorrectCount')?.textContent === '1');
  await page.waitForFunction(() => document.getElementById('logicPill')?.textContent.startsWith('2 / 10'));
  assert(await page.locator('#logicFeedback').count() === 0, `${name}: logic explanation UI should be removed`);
  await assertA11y(page, `${name} logic`);

  // Executive function: learn two rules, then verify the first planned rule switch.
  await page.locator('.back:visible').click();
  await page.locator('[data-mode="executive"]').click();
  await page.locator('#executive.active').waitFor();
  assert((await page.locator('#execRoundPill').innerText()).trim() === '1 / 18 · 熟悉 A', `${name}: executive should start an 18-round progression`);
  for (let round = 1; round <= 3; round++) {
    const rule = (await page.locator('#execRule').innerText()).trim();
    const value = Number((await page.locator('#execNumber').innerText()).trim());
    assert(Number.isFinite(value), `${name}: executive stimulus should be numeric`);
    let side;
    if (rule.includes('奇數 / 偶數')) side = value % 2 === 1 ? 'left' : 'right';
    else if (rule.includes('小於 5 / 大於 5')) side = value < 5 ? 'left' : 'right';
    else throw new Error(`${name}: unknown executive rule: ${rule}`);
    await page.locator(side === 'left' ? '#execLeft' : '#execRight').click();
    if (round < 3) await page.waitForFunction(r => document.getElementById('execRoundPill')?.textContent.startsWith((r + 1) + ' / 18'), round);
  }
  await page.waitForFunction(() => document.getElementById('execRoundPill')?.textContent.startsWith('4 / 18'));
  assert((await page.locator('#execRoundPill').innerText()).includes('熟悉 B'), `${name}: executive round 4 should enter rule B familiarization`);
  assert((await page.locator('#execRule').innerText()).includes('規則切換｜判斷小於 5 / 大於 5'), `${name}: executive round 4 should visibly switch rules`);
  const execLabels = await page.locator('#executive .stats .stat span').allInnerTexts();
  assert(execLabels.join('|') === '正確題數|切換命中|平均反應', `${name}: executive stat labels should be localized`);
  const execRtText = (await page.locator('#execRt').innerText()).trim();
  assert(execRtText.endsWith('秒'), `${name}: executive reaction time should be displayed in seconds`);
  const execSource = await page.locator('html').evaluate(el => el.innerHTML);
  assert(execSource.includes('execIsConflictValue') && execSource.includes('EXEC_TOTAL_ROUNDS=18'), `${name}: executive should include conflict trials and 18 rounds`);
  const execNumberStyle = await page.locator('#execNumber').evaluate(el => {
    const s = getComputedStyle(el);
    return { fontSize: parseFloat(s.fontSize), color: s.color, family: s.fontFamily };
  });
  assert(execNumberStyle.fontSize >= 160, `${name}: executive number should be visually dominant`);
  assert(/Arial Black|Avenir Next Condensed|Impact|Arial Narrow/.test(execNumberStyle.family), `${name}: executive number should use the dedicated display font stack`);
  const execStageBg = await page.locator('#executive .exec-stage').evaluate(el => getComputedStyle(el).backgroundColor);
  assert(execStageBg !== 'rgba(0, 0, 0, 0)', `${name}: executive number stage should use a high-contrast jump color`);
  await assertA11y(page, `${name} executive`);

  // Schulte: A/B only, 50 fixed cells, stronger drift, and completed cells stay in place.
  await page.locator('.back:visible').click();
  await page.locator('[data-mode="schulte"]').click();
  await page.locator('#schulte.active').waitFor();
  assert(await page.locator('.schulte-mode').count() === 2, `${name}: Schulte should expose A/B modes only`);
  assert(await page.locator('.schulte-mode[data-schulte-mode="C"]').count() === 0, `${name}: Schulte offset mode C should be removed`);
  assert(await page.locator('.schulte-mode[data-schulte-mode="D"]').count() === 0, `${name}: Schulte odd/even mode D should remain removed`);
  assert(await page.locator('#schulteGrid .schulte-cell').count() === 50, `${name}: Schulte grid should contain 50 fixed cells`);
  assert((await page.locator('#schulteModePill').innerText()).includes('A · 1 → 50'), `${name}: standalone Schulte should start in mode A`);
  const beforeOrder = await page.locator('#schulteGrid .schulte-cell').evaluateAll(nodes => nodes.map(n => n.dataset.number));
  const oneCell = page.locator('#schulteGrid .schulte-cell[data-number="1"]');
  const driftVars = await oneCell.locator('.schulte-float').evaluate(el => {
    const s = el.style;
    return [s.getPropertyValue('--float-x1'),s.getPropertyValue('--float-x2'),s.getPropertyValue('--float-y1'),s.getPropertyValue('--float-y2')];
  });
  assert(driftVars.some(v => Math.abs(parseFloat(v)) >= 4), `${name}: Schulte drift should use visibly larger travel`);
  await oneCell.click();
  await page.waitForFunction(() => document.getElementById('schulteNext')?.textContent === '2');
  assert(await page.locator('#schulteGrid .schulte-cell').count() === 50, `${name}: correct Schulte hit should keep all 50 cells visible`);
  const afterOrder = await page.locator('#schulteGrid .schulte-cell').evaluateAll(nodes => nodes.map(n => n.dataset.number));
  assert(beforeOrder.join(',') === afterOrder.join(','), `${name}: Schulte cell order should remain fixed after a correct hit`);
  assert(await oneCell.evaluate(el => el.classList.contains('done') && el.disabled), `${name}: completed Schulte cell should remain in place with a completed state`);
  assert(await page.locator('#schulteGrid .schulte-float').count() === 50, `${name}: all Schulte drift wrappers should remain present`);
  await page.locator('.schulte-mode[data-schulte-mode="B"]').click();
  await page.waitForFunction(() => document.getElementById('schulteNext')?.textContent === '50');
  assert((await page.locator('#schulteModePill').innerText()).includes('B · 50 → 1'), `${name}: Schulte mode B should reverse the target order`);
  const schulteSource = await page.locator('html').evaluate(el => el.innerHTML);
  assert(schulteSource.includes("['A','B'][rand(0,1)]") && !schulteSource.includes('relayoutSchulteAfterHit'), `${name}: Schulte daily pool should use only A/B and never relayout completed hits`);
  await assertA11y(page, `${name} schulte`);

  // Stroop: 20 trials with fixed congruent/conflict mix and seconds-based reaction time.
  await page.locator('.back:visible').click();
  await page.locator('[data-mode="stroop"]').click();
  await page.locator('#stroop.active').waitFor();
  assert((await page.locator('#stroopPill').innerText()).trim() === '1 / 20', `${name}: Stroop should run 20 trials`);
  const stroopColor = await page.locator('#stroopWord').getAttribute('data-color');
  const stroopWordKey = await page.locator('#stroopWord').getAttribute('data-word');
  const stroopTag = (await page.locator('#stroopTrialTag').innerText()).trim();
  assert(['red','blue','green','yellow'].includes(stroopColor), `${name}: invalid Stroop color`);
  assert(['red','blue','green','yellow'].includes(stroopWordKey), `${name}: invalid Stroop word key`);
  if(stroopTag === '一致題') assert(stroopColor === stroopWordKey, `${name}: congruent Stroop trial must match word and color`);
  if(stroopTag === '衝突題') assert(stroopColor !== stroopWordKey, `${name}: conflict Stroop trial must mismatch word and color`);
  await page.locator(`#stroopChoices [data-color="${stroopColor}"]`).click();
  await page.waitForFunction(() => document.getElementById('stroopCorrect')?.textContent === '1');
  assert((await page.locator('#stroopRt').innerText()).trim().endsWith('秒'), `${name}: Stroop reaction time should be displayed in seconds`);
  const stroopSource = await page.locator('html').evaluate(el => el.innerHTML);
  assert(stroopSource.includes('for(var i=0;i<6;i++)types.push(\'congruent\')') && stroopSource.includes('for(var j=0;j<14;j++)types.push(\'conflict\')'), `${name}: Stroop schedule should contain 6 congruent and 14 conflict trials`);
  await assertA11y(page, `${name} stroop`);

  // 表裡不一: 16 rounds, one semantic mismatch, and increasing search density.
  await page.locator('.back:visible').click();
  await page.locator('[data-mode="odd"]').click();
  await page.locator('#odd.active').waitFor();
  assert((await page.locator('#oddPill').innerText()).trim() === '1 / 16 · 16 格', `${name}: odd challenge should start at 16 cells`);
  assert(await page.locator('#oddGrid .odd-cell').count() === 16, `${name}: odd grid should start with 16 cells`);
  assert(await page.locator('#oddGrid .odd-cell[data-odd="true"]').count() === 1, `${name}: odd grid must have exactly one mismatch`);
  const oddSemanticCheck = await page.locator('#oddGrid .odd-cell').evaluateAll(nodes => nodes.map(n => ({odd:n.dataset.odd, arrow:n.dataset.arrow, label:n.dataset.label})));
  assert(oddSemanticCheck.filter(x => x.arrow !== x.label).length === 1, `${name}: exactly one odd cell should have mismatched arrow and label semantics`);
  assert(oddSemanticCheck.every(x => (x.odd === 'true') === (x.arrow !== x.label)), `${name}: odd marker must match the semantic mismatch`);
  await page.locator('#oddGrid .odd-cell[data-odd="true"]').click();
  await page.waitForFunction(() => document.getElementById('oddPill')?.textContent.startsWith('2 / 16'));
  assert((await page.locator('#oddCorrect').innerText()).trim() === '1/1', `${name}: first-hit tracker should record a clean first round`);
  assert((await page.locator('#oddRt').innerText()).trim().endsWith('秒'), `${name}: odd search time should be displayed in seconds`);
  const oddSource = await page.locator('html').evaluate(el => el.innerHTML);
  assert(oddSource.includes('round<=4?16:round<=10?20:24'), `${name}: odd challenge should progress through 16, 20, and 24-cell densities`);
  await assertA11y(page, `${name} odd`);

  await context.close();
}

async function runNarrowHome(browser) {
  const context = await browser.newContext({ viewport: { width: 320, height: 720 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/adult-brain-training/', { waitUntil: 'networkidle' });
  const metrics = await page.evaluate(() => {
    const preview = document.getElementById('homePreview').getBoundingClientRect();
    const modes = document.querySelector('.modes').getBoundingClientRect();
    const play = document.getElementById('previewPlay').getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      previewTop: preview.top,
      modesTop: modes.top,
      playHeight: play.height
    };
  });
  assert(metrics.overflow <= 1, `narrow-mobile: horizontal overflow detected (${metrics.overflow}px)`);
  assert(metrics.previewTop < metrics.modesTop, 'narrow-mobile: preview should appear before the mode list');
  assert(metrics.playHeight >= 44, `narrow-mobile: preview action is too small (${metrics.playHeight}px)`);
  await assertA11y(page, 'narrow-mobile home');
  await context.close();
}

async function runAwardResponsiveShell(browser, width, height, label) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/adult-brain-training/', { waitUntil: 'networkidle' });
  const shell = await page.evaluate(() => {
    const daily = document.getElementById('dailyBtn').getBoundingClientRect();
    const sound = document.getElementById('soundBtn').getBoundingClientRect();
    const circuits = [...document.querySelectorAll('.circuit-strip button')].map(x => x.getBoundingClientRect());
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      dailyHeight: daily.height,
      soundWidth: sound.width,
      soundHeight: sound.height,
      circuitMin: Math.min(...circuits.map(r => Math.min(r.width, r.height))),
      heroBadges: document.querySelectorAll('.hero-chip').length
    };
  });
  assert(shell.overflow <= 1, `${label}: horizontal overflow detected (${shell.overflow}px)`);
  assert(shell.dailyHeight >= 44, `${label}: primary action is too small`);
  assert(shell.soundWidth >= 44 && shell.soundHeight >= 44, `${label}: sound control is below 44px`);
  assert(shell.circuitMin >= 44, `${label}: circuit preview controls must be at least 44px`);
  assert(shell.heroBadges === 0, `${label}: homepage should not regress to SaaS-style hero badges`);
  await page.locator('[data-mode="math"]').click();
  await page.locator('#math.active').waitFor();
  assert((await page.locator('#math .stats').innerText()).includes('時間'), `${label}: math HUD should use localized labels`);
  await assertA11y(page, `${label} responsive shell`);
  await context.close();
}

async function runReducedMotion(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/adult-brain-training/', { waitUntil: 'networkidle' });
  await page.locator('[data-mode="logic"]').click();
  assert(await page.locator('#transitionBurst .burst-rays').count() === 0, 'reduced motion should skip radial rays');
  await page.locator('#logic.active').waitFor();
  const duration = await page.evaluate(() => getComputedStyle(document.querySelector('.mode')).transitionDuration);
  assert(duration === '0s' || duration === '1e-06s' || duration === '0.001ms', `reduced motion transition not reduced: ${duration}`);
  await context.close();
}

async function runChillJourney(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.clock.install();
  await page.goto('http://127.0.0.1:4173/adult-brain-training/', { waitUntil: 'networkidle' });
  await page.locator('[data-preview-mode="schulte"]').click();
  await page.locator('[data-mode="memory"]').hover();
  assert((await page.locator('#previewTitle').innerText()) === '舒爾特方格', 'hover must not change an explicitly chosen preview');
  await page.locator('#previewPlay').click();
  await page.clock.runFor(40);
  await page.locator('#schulte.active').waitFor();
  await page.locator('#pauseBtn').click();
  const pausedTime = await page.locator('#schulteTime').innerText();
  await page.clock.runFor(10000);
  assert((await page.locator('#schulteTime').innerText()) === pausedTime, 'Schulte clock must freeze while paused');
  await assertA11y(page, 'pause dialog');
  await page.keyboard.press('Escape');
  assert(await page.locator('#pauseOverlay').isHidden(), 'Escape must resume without immediately pausing again');
  await page.clock.runFor(150);
  assert(parseFloat(await page.locator('#schulteTime').innerText()) < 2, 'paused seconds must be excluded from elapsed time');
  await page.locator('#finishEarlyBtn').click();
  await page.locator('#result.active').waitFor();
  assert((await page.locator('#resultScore').innerText()) === '☆', 'unfinished play must not be given a completion star');
  await page.locator('.back:visible').click();

  // Whole session: all seven real start -> play -> recap loops, including wrong answers.
  await page.locator('#dailyBtn').click();
  await page.locator('#math.active').waitFor();
  await page.clock.runFor(1200);
  await page.locator('#pauseBtn').click();
  const mathTime = await page.locator('#mathTime').innerText();
  await page.clock.runFor(120000);
  assert((await page.locator('#mathTime').innerText()) === mathTime, 'math deadline must not expire while paused');
  const mathValue = await page.locator('#mathAnswer').inputValue();
  await page.keyboard.press('7');
  assert((await page.locator('#mathAnswer').inputValue()) === mathValue, 'paused game must reject keyboard answers');
  await page.locator('#resumeBtn').click();
  await page.evaluate(() => {Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});
  assert(await page.locator('#pauseOverlay').isVisible(), 'hidden tab must pause the game');
  await page.clock.runFor(15000);
  assert((await page.locator('#mathTime').innerText()) === mathTime, 'hidden tab time must not count toward deadline');
  await page.evaluate(() => {delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
  assert(await page.locator('#pauseOverlay').isVisible(), 'returning to a tab must wait for manual resume');
  await page.locator('#resumeBtn').click();
  await page.clock.runFor(60000);
  await page.locator('#sessionBreak.active').waitFor();
  assert((await page.locator('#sessionBreakScore').innerText()) === '★', 'playing to the time limit earns a completion star regardless of accuracy');
  await page.locator('#sessionNext').click();
  await page.locator('#memory.active').waitFor();
  await page.locator('#memoryStart').click();
  for (let round=0; round<10; round++) {
    const digits = await page.locator('#memoryNumber').innerText();
    if(round===0) {
      await page.clock.runFor(2000);
      await page.locator('#pauseBtn').click();
      await page.clock.runFor(12000);
      assert((await page.locator('#memoryNumber').innerText()) === digits, 'memory exposure must freeze before answer entry');
      await page.locator('#resumeBtn').click();
      await page.clock.runFor(3100);
      const timerBefore = await page.locator('#memoryAnswerTimer').innerText();
      await page.locator('#pauseBtn').click();
      await page.clock.runFor(15000);
      assert((await page.locator('#memoryAnswerTimer').innerText()) === timerBefore, 'memory answer deadline must freeze');
      await page.locator('#resumeBtn').click();
    } else await page.clock.runFor(5100);
    await page.locator('#memoryAnswer').fill(digits);
    await page.locator('#memorySubmit').click();
    await page.clock.runFor(950);
  }
  await page.locator('#sessionBreak.active').waitFor();
  await page.locator('#sessionNext').click();
  await page.locator('#logic.active').waitFor();
  for(let round=0;round<10;round++) {
    await page.locator('#logicChoices .choice').first().click();
    await page.locator('#logicSubmit').click();
    await page.clock.runFor(300);
  }
  await page.locator('#sessionBreak.active').waitFor();
  await page.locator('#sessionNext').click();
  for(let round=0;round<18;round++) {
    const rule=await page.locator('#execRule').innerText(),n=Number(await page.locator('#execNumber').innerText());
    const left=rule.includes('奇數 / 偶數')?n%2===1:n<5;
    await page.locator(left?'#execLeft':'#execRight').click();
    await page.clock.runFor(200);
  }
  await page.locator('#sessionBreak.active').waitFor();
  await page.locator('#sessionNext').click();
  const reverse=(await page.locator('#schulteModePill').innerText()).startsWith('B');
  for(let i=0;i<50;i++) await page.locator(`#schulteGrid [data-number="${reverse?50-i:i+1}"]`).click();
  await page.locator('#sessionBreak.active').waitFor();
  await page.locator('#sessionNext').click();
  for(let round=0;round<20;round++) {
    const color=await page.locator('#stroopWord').getAttribute('data-color');
    await page.locator(`#stroopChoices [data-color="${color}"]`).click();
    await page.clock.runFor(200);
  }
  await page.locator('#sessionBreak.active').waitFor();
  await page.locator('#sessionNext').click();
  for(let round=0;round<16;round++) {
    await page.locator('#oddGrid [data-odd="true"]').click();
    await page.clock.runFor(200);
  }
  await page.locator('#sessionBreak.active').waitFor();
  await page.locator('#sessionNext').click();
  await page.locator('#dailyResult.active').waitFor();
  assert(await page.locator('#dailyScore .lit').count() === 7, 'full session must show seven completion stars');
  assert(await page.locator('#dailySummary .journey-row').count() === 7, 'full recap must show every game');
  assert(!/分數|總分|評分|DAILY SCORE/.test(await page.locator('#dailyResult').innerText()), 'recap must not rank or score the player');
  await assertA11y(page, 'seven-star recap');
  await page.screenshot({path:'/tmp/brain7-chill-recap-mobile.png',fullPage:true});
  await page.locator('.back:visible').click();
  await page.locator('#recentPlays > summary').click();
  assert((await page.locator('#historyList').innerText()).includes('7 顆完成星'), 'history must record the full journey');
  await page.reload();
  await page.locator('#recentPlays > summary').click();
  assert((await page.locator('#historyList').innerText()).includes('7 顆完成星'), 'history must survive reload');

  // Leaving during a delayed next-question callback must cancel it.
  await page.locator('[data-mode="odd"]').click();
  await page.locator('#odd.active').waitFor();
  await page.locator('#oddGrid [data-odd="true"]').click();
  await page.locator('.back:visible').click();
  await page.clock.runFor(1000);
  assert(await page.locator('#home.active').isVisible(), 'old round callback must not restore a departed game');
  assert((await page.locator('#oddPill').textContent()).startsWith('1 / 16'), 'old round callback must not advance after leaving');
  await page.locator('#dailyBtn').click();
  await page.locator('#math.active').waitFor();
  await page.locator('#finishEarlyBtn').click();
  await page.locator('#dailyResult.active').waitFor();
  assert(await page.locator('#dailyScore .lit').count() === 0, 'early session exit must not claim completed games');
  assert((await page.locator('#dailyResult .gamehead h2').innerText()) === '這次先玩到這裡', 'early session recap should describe an unfinished journey');
  await page.locator('.back:visible').click();
  await page.locator('.audio-settings > summary').click();
  await page.locator('#musicVolume').evaluate(el => {el.value='25';el.dispatchEvent(new Event('input',{bubbles:true}))});
  assert((await page.locator('#musicValue').innerText()) === '25%', 'music control must update its visible value');
  await page.reload();
  assert(await page.locator('#musicVolume').inputValue() === '25', 'music preference must survive reload');
  assert(errors.length===0, 'runtime errors: '+errors.join('; '));
  await page.screenshot({path:'/tmp/brain7-chill-home-mobile.png',fullPage:true});
  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await runViewport(browser, { width: 390, height: 844 }, 'mobile');
  await runViewport(browser, { width: 1280, height: 900 }, 'desktop');
  await runNarrowHome(browser);
  await runAwardResponsiveShell(browser, 375, 812, '375px');
  await runAwardResponsiveShell(browser, 414, 896, '414px');
  await runAwardResponsiveShell(browser, 768, 1024, '768px');
  await runReducedMotion(browser);
  await runChillJourney(browser);
  console.log('browser-qa: PASS — 7 games, mobile + desktop, accessibility, and reduced-motion checks passed.');
} finally {
  await browser.close();
}

