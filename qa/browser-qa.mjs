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

async function acceptReady(page) {
  const ready = page.locator('#readyOverlay');
  if (await ready.isVisible()) {
    assert((await page.locator('#readyRule').innerText()).trim().length > 0, 'first play must show its rule before the game starts');
    await assertA11y(page, 'first-play rules');
    await page.locator('#readyStart').click();
  }
}

async function exitToHome(page) {
  const fromGame = await page.locator('.screen.active').evaluate(el=>['math','memory','logic','executive','schulte','stroop','odd'].includes(el.id));
  await page.locator('.back:visible').click();
  if (fromGame) assert(await page.locator('#result.active,#dailyResult.active').isVisible(),'leaving a game should always open a recap');
  const hasNextPicker = await page.locator('#result.active').isVisible();
  if (hasNextPicker) {
    await page.getByRole('button', {name:'挑下一關',exact:true}).click();
  } else if (await page.locator('#dailyResult.active').isVisible()) {
    await page.locator('#dailyResult .back').click();
  }
  await page.locator('#home.active').waitFor();
  if(hasNextPicker){await page.locator('.mode:focus').waitFor();assert(await page.locator('.mode:focus').count()===1,'next-game action should focus the selection list')}
}

async function runViewport(browser, viewport, name) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.on('pageerror', e => console.error('BROWSER ERROR:', e.message));
  await page.goto('http://127.0.0.1:4173/adult-brain-training/', { waitUntil: 'networkidle' });

  assert(await page.title() === 'Knock Knock', `${name}: wrong page title`);
  assert((await page.locator('meta[name="color-scheme"]').getAttribute('content')) === 'light', `${name}: Knock Knock should use the light color scheme`);
  assert((await page.locator('meta[name="application-name"]').getAttribute('content')) === 'Knock Knock', `${name}: application identity metadata is missing`);
  assert((await page.locator('link[rel="canonical"]').getAttribute('href')) === 'https://qookey109-pixel.github.io/quick-math-brain-training/adult-brain-training/', `${name}: canonical URL should target the public Knock Knock page`);
  assert((await page.locator('link[rel="icon"]').getAttribute('href')) === './brain7-mark.svg', `${name}: Knock Knock favicon should be declared`);
  assert((await page.locator('link[rel="manifest"]').getAttribute('href')) === './manifest.webmanifest', `${name}: web app manifest should be declared`);
  assert((await page.locator('meta[property="og:title"]').getAttribute('content')) === 'Knock Knock', `${name}: Open Graph title should expose the product identity`);
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
  assert(publicIdentity.manifestOk && publicIdentity.shortName === 'Knock Knock', `${name}: manifest should load and identify Knock Knock`);
  assert(publicIdentity.iconOk && publicIdentity.iconSrc === './brain7-mark.svg', `${name}: identity icon should load and be linked from the manifest`);
  assert(await page.locator('.mode').count() === 7, `${name}: expected seven modes`);
  assert(await page.locator('.rating-guide').count() === 0, `${name}: star conversion explanation should be removed`);
  const starCopy = await page.locator('#home .hero p').first().innerText();
  assert(starCopy.includes('每關最多五顆星。') && !starCopy.includes('依答題表現點亮'), `${name}: home should show only the star rating, without an explanation`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 1, `${name}: horizontal overflow detected (${overflow}px)`);
  await assertA11y(page, `${name} home`);
  await page.screenshot({path:'/tmp/brain7-chill-home-'+name+'.png',fullPage:true});

  // Home interactive circuit preview
  assert(await page.locator('.circuit-strip').count() === 0, `${name}: unlabeled color strip should be removed`);
  assert(await page.locator('#previewSelect option').count() === 7, `${name}: expected seven named preview choices`);
  assert(await page.locator('.mode-start').count() === 7, `${name}: each game card must state its action`);
  await page.locator('#previewSelect').selectOption('schulte');
  assert((await page.locator('#previewIndex').innerText()).trim() === '05', `${name}: preview index should switch to 05`);
  assert((await page.locator('#previewLabel').innerText()).trim() === 'SEARCH', `${name}: preview label should switch to SEARCH`);
  assert((await page.locator('#previewTitle').innerText()).trim() === '舒爾特方格', `${name}: preview title should switch to Schulte`);
  await page.locator('#previewPlay').click();
  await acceptReady(page);
  await page.locator('#schulte.active').waitFor();
  assert(await page.locator('#transitionBurst .burst-rays').count() === 0, 'first entry must use the gentle transition');
  assert(await page.evaluate(() => document.activeElement === document.querySelector('#schulte h2')), 'screen entry must focus its heading');
  await exitToHome(page);
  await page.locator('#home.active').waitFor();
  await page.locator('#previewSelect').selectOption('math');
  const homePreview = page.locator('#homePreview');
  await homePreview.focus();
  await homePreview.press('ArrowRight');
  await page.waitForFunction(() => document.getElementById('previewIndex')?.textContent.trim() === '02');
  assert((await page.locator('#previewIndex').innerText()).trim() === '02', `${name}: keyboard preview should advance to 02`);
  await page.locator('#previewSelect').selectOption('math');


  // Daily Training contract: the public session must run all seven games in sequence.
  assert((await page.locator('#home .hero p:not(.session-info)').innerText()).includes('7 個小遊戲'), `${name}: home copy must describe the seven-game session`);
  await page.locator('#dailyBtn').click();
  await acceptReady(page);
  await page.locator('#math.active').waitFor();
  assert((await page.locator('#math .gamehead h2').innerText()) === '快速心算', `${name}: Daily Training must start with Quick Math`);
  await exitToHome(page);


  // Math: root Quick Math rules — 60 sec per level, 8 correct to advance, score + streak.
  await page.locator('[data-mode="math"]').click();
  await acceptReady(page);
  // Soft entry never obscures the game with full-screen radial rays.
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
  assert(!(await page.locator('#mathPlayed').isVisible()), `${name}: played-question count should not add pressure during play`);
  assert(await page.locator('#mathScore').count() === 0, `${name}: numeric score must be removed`);
  assert(!(await page.locator('#mathStreak').isVisible()), `${name}: streak should be kept out of the live HUD`);
  const source = await page.locator('html').evaluate(el => el.innerHTML);
  assert(!source.includes("' × '+b+' + '+c1"), `${name}: math must not contain three-operand arithmetic`);
  assert(source.includes('[0,20,40,70,100,150,200,250,300,400,500]'), `${name}: math should use the easier two-number progression`);
  assert(source.includes("MATH_MAX_LEVEL=10"), `${name}: Quick Math should cap at LV10`);
  assert(source.includes('#math{--chapter:#ff6b4a}') && source.includes('#odd{--chapter:#a78bfa}'), `${name}: game screens should expose chapter colors`);
  await assertA11y(page, `${name} math`);

  // Memory: 10 rounds with fixed exposure time; difficulty rises only by digit count.
  await exitToHome(page);
  await page.locator('[data-mode="memory"]').click();
  await acceptReady(page);
  await page.locator('#memory.active').waitFor();
  assert((await page.locator('#memoryRoundPill').innerText()).trim() === '1 / 10', `${name}: memory should expose a 10-round progression`);
  await page.locator('#memoryStart').click();
  const shown = (await page.locator('#memoryNumber').innerText()).replace(/\s/g,'');
  assert(/^\d{4}$/.test(shown), `${name}: first memory round should show 4 digits`);
  await page.locator('#memoryEntry').waitFor({ state: 'visible', timeout: 7000 });
  assert((await page.locator('#memoryAnswerTimer').innerText()).includes('不限時'), `${name}: memory should show its untimed answer state`);
  for(const digit of shown) await page.locator('#memoryKeys button').filter({hasText:new RegExp('^'+digit+'$')}).click();
  await page.locator('#memorySubmit').click();
  await page.waitForFunction(() => document.getElementById('memoryNumber')?.textContent === '正確');
  const memorySource = await page.locator('html').evaluate(el => el.innerHTML);
  assert(memorySource.includes('MEMORY_SHOW_MS=6000'), `${name}: memory exposure time should stay fixed at 6 seconds`);
  assert(!memorySource.includes('MEMORY_ANSWER_MS='), `${name}: memory must not have an answer deadline`);
  assert(memorySource.includes('{digits:9,points:9}') && !memorySource.includes('{digits:10,points:10}'), `${name}: memory should cap at 9 digits`);
  assert(memorySource.includes('{digits:4,points:4},\n    {digits:4,points:4}') && memorySource.includes('{digits:7,points:7},\n    {digits:7,points:7}'), `${name}: memory progression should repeat early difficulty steps`);
  assert(!memorySource.includes("mode:'mask'") && !memorySource.includes("mode:'reverse'"), `${name}: memory difficulty should not depend on MASK or REVERSE modes`);
  await assertA11y(page, `${name} memory`);

  // Logic: first generated puzzle is an ordering template with a formally unique middle person.
  await exitToHome(page);
  await page.locator('[data-mode="logic"]').click();
  assert(await page.locator('#readyOverlay').isVisible(),'first play should show a rule sheet before starting');
  assert(await page.locator('#logic.active').isHidden(),'game should not start before confirming its rules');
  await page.locator('#readyCancel').click();
  assert(await page.locator('#home.active').isVisible(),'canceling the rule sheet should return to selection');
  await page.locator('[data-mode="logic"]').click();
  await acceptReady(page);
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
  assert((await page.locator('#logic .mini-instruction').innerText()).includes('作答不限時'), `${name}: logic should be untimed`);
  const logicSource = await page.locator('html').evaluate(el => el.innerHTML);
  assert(!logicSource.includes('LOGIC_ANSWER_MS='), `${name}: logic must not have an answer deadline`);
  assert(await page.locator('#logicSubmit').count()===0, `${name}: logic must not require a confirm button`);
  assert(!logicSource.includes('正確答案：') && !logicSource.includes("q.explain"), `${name}: logic should not display answer explanations after submission`);
  await logicChoices.filter({ hasText: new RegExp('^' + middlePerson + '$') }).click();
  await page.waitForFunction(() => document.getElementById('logicCorrectCount')?.textContent === '1');
  await page.waitForFunction(() => document.getElementById('logicPill')?.textContent.startsWith('2 / 10'));
  assert(await page.locator('#logicFeedback').count() === 0, `${name}: logic explanation UI should be removed`);
  await assertA11y(page, `${name} logic`);

  // Executive function: learn two rules, then verify the first planned rule switch.
  await exitToHome(page);
  await page.locator('[data-mode="executive"]').click();
  await acceptReady(page);
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
  assert(!(await page.locator('#executive .stats').isVisible()), `${name}: reaction and accuracy stats should wait until recap`);
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
  await exitToHome(page);
  await page.locator('[data-mode="schulte"]').click();
  await acceptReady(page);
  await page.locator('#schulte.active').waitFor();
  assert(await page.locator('.schulte-mode').count() === 2, `${name}: Schulte should expose A/B modes only`);
  assert(await page.locator('.schulte-mode[data-schulte-mode="C"]').count() === 0, `${name}: Schulte offset mode C should be removed`);
  assert(await page.locator('.schulte-mode[data-schulte-mode="D"]').count() === 0, `${name}: Schulte odd/even mode D should remain removed`);
  assert(await page.locator('#schulteGrid .schulte-cell').count() === 50, `${name}: Schulte grid should contain 50 fixed cells`);
  assert((await page.locator('#schulteModePill').innerText()).includes('A · 1 → 50'), `${name}: standalone Schulte should start in mode A`);
  const beforeColors=await page.locator('#schulteGrid button').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.dataset.number,n.style.getPropertyValue('--cell-bg')])));
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
  assert(beforeOrder.indexOf('1') === afterOrder.indexOf('1'), `${name}: completed Schulte number must stay in its original slot`);
  assert(beforeOrder.join(',') !== afterOrder.join(','), `${name}: unfinished numbers must change positions after a hit`);
  const colorsChanged=await page.locator('#schulteGrid button:not(.done)').evaluateAll((nodes,before)=>nodes.every(n=>n.style.getPropertyValue('--cell-bg')!==before[n.dataset.number]),beforeColors);
  assert(colorsChanged, `${name}: every unfinished Schulte number must change its background color`);
  assert(await oneCell.evaluate(el => el.classList.contains('done') && el.disabled), `${name}: completed Schulte cell should remain in place with a completed state`);
  assert(await page.locator('#schulteGrid .schulte-float').count() === 50, `${name}: all Schulte drift wrappers should remain present`);
  await page.locator('.schulte-mode[data-schulte-mode="B"]').click();
  await page.waitForFunction(() => document.getElementById('schulteNext')?.textContent === '50');
  assert((await page.locator('#schulteModePill').innerText()).includes('B · 50 → 1'), `${name}: Schulte mode B should reverse the target order`);
  const schulteSource = await page.locator('html').evaluate(el => el.innerHTML);
  assert(schulteSource.includes("['A','B'][rand(0,1)]"), `${name}: Schulte daily pool should use only A/B and pin completed hits`);
  await assertA11y(page, `${name} schulte`);

  // Stroop: 20 trials with fixed congruent/conflict mix and seconds-based reaction time.
  await exitToHome(page);
  await page.locator('[data-mode="stroop"]').click();
  await acceptReady(page);
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
  assert(!(await page.locator('#stroop .stats').isVisible()), `${name}: Stroop performance details should wait until recap`);
  const stroopSource = await page.locator('html').evaluate(el => el.innerHTML);
  assert(stroopSource.includes('for(var i=0;i<6;i++)types.push(\'congruent\')') && stroopSource.includes('for(var j=0;j<14;j++)types.push(\'conflict\')'), `${name}: Stroop schedule should contain 6 congruent and 14 conflict trials`);
  await assertA11y(page, `${name} stroop`);

  // 表裡不一: 16 rounds, one semantic mismatch, and increasing search density.
  await exitToHome(page);
  await page.locator('[data-mode="odd"]').click();
  await acceptReady(page);
  await page.locator('#odd.active').waitFor();
  assert((await page.locator('#oddPill').innerText()).trim() === '1 / 16 · 16 格', `${name}: odd challenge should start at 16 cells`);
  assert(await page.locator('#oddGrid .odd-cell').count() === 16, `${name}: odd grid should start with 16 cells`);
  assert(await page.locator('#oddGrid .odd-cell[data-odd="true"]').count() === 1, `${name}: odd grid must have exactly one mismatch`);
  const oddSemanticCheck = await page.locator('#oddGrid .odd-cell').evaluateAll(nodes => nodes.map(n => ({odd:n.dataset.odd, arrow:n.dataset.arrow, label:n.dataset.label})));
  assert(oddSemanticCheck.filter(x => x.arrow !== x.label).length === 1, `${name}: exactly one odd cell should have mismatched arrow and label semantics`);
  assert(oddSemanticCheck.every(x => (x.odd === 'true') === (x.arrow !== x.label)), `${name}: odd marker must match the semantic mismatch`);
  await page.locator('#oddGrid .odd-cell[data-odd="true"]').click();
  await page.waitForFunction(() => document.getElementById('oddPill')?.textContent.startsWith('2 / 16'));
  assert(!(await page.locator('#odd .stats').isVisible()), `${name}: odd performance details should wait until recap`);
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
    const picker = document.getElementById('previewSelect').getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      dailyHeight: daily.height,
      soundWidth: sound.width,
      soundHeight: sound.height,
      pickerHeight: picker.height,
      heroBadges: document.querySelectorAll('.hero-chip').length
    };
  });
  assert(shell.overflow <= 1, `${label}: horizontal overflow detected (${shell.overflow}px)`);
  assert(shell.dailyHeight >= 44, `${label}: primary action is too small`);
  assert(shell.soundWidth >= 44 && shell.soundHeight >= 44, `${label}: sound control is below 44px`);
  assert(shell.pickerHeight >= 44, `${label}: named preview picker must be at least 44px`);
  assert(shell.heroBadges === 0, `${label}: homepage should not regress to SaaS-style hero badges`);
  await page.locator('[data-mode="math"]').click();
  await acceptReady(page);
  await page.locator('#math.active').waitFor();
  assert((await page.locator('#mathTime').innerText()).trim()==='60' && (await page.locator('#mathLevelMark').innerText()).includes('LV 1'), `${label}: math should keep its timer and level visible`);
  await assertA11y(page, `${label} responsive shell`);
  await context.close();
}

async function runReducedMotion(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/adult-brain-training/', { waitUntil: 'networkidle' });
  await page.locator('[data-mode="logic"]').click();
  assert(await page.locator('#readyOverlay').isVisible(),'first play should show a rule sheet before starting');
  assert(await page.locator('#logic.active').isHidden(),'game should not start before confirming its rules');
  await page.locator('#readyCancel').click();
  assert(await page.locator('#home.active').isVisible(),'canceling the rule sheet should return to selection');
  await page.locator('[data-mode="logic"]').click();
  await acceptReady(page);
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
  await page.locator('#previewSelect').selectOption('schulte');
  await page.locator('[data-mode="memory"]').hover();
  assert((await page.locator('#previewTitle').innerText()) === '舒爾特方格', 'hover must not change an explicitly chosen preview');
  await page.locator('#previewPlay').click();
  await acceptReady(page);
  await page.clock.runFor(40);
  await page.locator('#schulte.active').waitFor();
  await page.locator('#pauseBtn').click();
  const pausedTime = await page.locator('#schulteTime').textContent();
  await page.clock.runFor(10000);
  assert((await page.locator('#schulteTime').textContent()) === pausedTime, 'Schulte clock must freeze while paused');
  await assertA11y(page, 'pause dialog');
  await page.keyboard.press('Escape');
  assert(await page.locator('#pauseOverlay').isHidden(), 'Escape must resume without immediately pausing again');
  await page.clock.runFor(150);
  assert(parseFloat(await page.locator('#schulteTime').textContent()) < 2, 'paused seconds must be excluded from elapsed time');
  await page.locator('#pauseBtn').click();
  await page.locator('#pauseFinishBtn').focus();
  await page.keyboard.press('Tab');
  assert(await page.locator('#resumeBtn').evaluate(el=>document.activeElement===el),'pause controls should keep keyboard focus within the dialog');
  await page.locator('#pauseFinishBtn').click();
  await page.locator('#result.active').waitFor();
  assert(await page.getByRole('button',{name:'挑下一關',exact:true}).isVisible(),'single-game recap should offer direct next-game selection');
  assert((await page.locator('#resultScore').innerText()) === '☆☆☆☆☆', 'unfinished play must show five unlit slots');
  await exitToHome(page);

  // Whole session: all seven real start -> play -> recap loops, including wrong answers.
  await page.locator('#dailyBtn').click();
  await acceptReady(page);
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
  assert((await page.locator('#sessionBreakScore').innerText()) === '☆☆☆☆☆', 'zero correct answers must earn zero stars');
  await page.locator('#sessionNext').click();
  await acceptReady(page);
  await page.locator('#memory.active').waitFor();
  await page.locator('#memoryStart').click();
  for (let round=0; round<10; round++) {
    const digits = (await page.locator('#memoryNumber').innerText()).replace(/\s/g,'');
    if(round===0) {
      await page.clock.runFor(2000);
      await page.locator('#pauseBtn').click();
      await page.clock.runFor(12000);
      assert((await page.locator('#memoryNumber').innerText()).replace(/\s/g,'') === digits, 'memory exposure must freeze before answer entry');
      await page.locator('#resumeBtn').click();
      await page.clock.runFor(4100);
      const timerBefore = await page.locator('#memoryAnswerTimer').innerText();
      await page.locator('#pauseBtn').click();
      await page.clock.runFor(15000);
      assert((await page.locator('#memoryAnswerTimer').innerText()) === timerBefore, 'memory answer deadline must freeze');
      await page.locator('#resumeBtn').click();
    } else await page.clock.runFor(6100);
    if(round===0){await page.clock.runFor(60000);assert(await page.locator('#memoryKeys').isVisible(),'memory must wait indefinitely for an answer')}
    if(round>=8)assert(await page.locator('#memoryNumber .memory-digit-row').count()===2,'long memory values must have two balanced rows');
    for(const digit of digits) await page.locator('#memoryKeys button').filter({hasText:new RegExp('^'+digit+'$')}).click();
    await page.locator('#memorySubmit').click();
    await page.clock.runFor(950);
  }
  await page.locator('#sessionBreak.active').waitFor();
  await page.locator('#sessionNext').click();
  await acceptReady(page);
  await page.locator('#logic.active').waitFor();
  const logicTypes=new Set();
  await page.clock.runFor(60000);assert((await page.locator('#logicPill').innerText()).startsWith('1 / 10'),'logic must not time out');
  for(let round=0;round<10;round++) {
    logicTypes.add((await page.locator('#logicPill').innerText()).split(' · ')[1]);
    await page.locator('#logicChoices .choice').first().click();
      await page.clock.runFor(300);
  }
  assert(logicTypes.size===8,'every ten-question session must contain eight distinct logic types');
  await page.locator('#sessionBreak.active').waitFor();
  await page.locator('#sessionNext').click();
  await acceptReady(page);
  for(let round=0;round<18;round++) {
    const rule=await page.locator('#execRule').innerText(),n=Number(await page.locator('#execNumber').innerText());
    const left=rule.includes('奇數 / 偶數')?n%2===1:n<5;
    await page.locator(left?'#execLeft':'#execRight').click();
    await page.clock.runFor(200);
  }
  await page.locator('#sessionBreak.active').waitFor();
  await page.locator('#sessionNext').click();
  await acceptReady(page);
  const reverse=(await page.locator('#schulteModePill').innerText()).startsWith('B');
  for(let i=0;i<50;i++) await page.locator(`#schulteGrid [data-number="${reverse?50-i:i+1}"]`).click();
  await page.locator('#sessionBreak.active').waitFor();
  await page.locator('#sessionNext').click();
  await acceptReady(page);
  for(let round=0;round<20;round++) {
    const color=await page.locator('#stroopWord').getAttribute('data-color');
    await page.locator(`#stroopChoices [data-color="${color}"]`).click();
    await page.clock.runFor(200);
  }
  await page.locator('#sessionBreak.active').waitFor();
  await page.locator('#sessionNext').click();
  await acceptReady(page);
  for(let round=0;round<16;round++) {
    await page.locator('#oddGrid [data-odd="true"]').click();
    await page.clock.runFor(200);
  }
  await page.locator('#sessionBreak.active').waitFor();
  await page.locator('#sessionNext').click();
  await page.locator('#dailyResult.active').waitFor();
  assert(await page.locator('#dailySummary .journey-rating span').count() === 35, 'seven games must each show five rating slots');
  for (const mode of ['memory','executive','schulte','stroop','odd']) {
    const row = page.locator('#dailySummary .journey-row').nth(['math','memory','logic','executive','schulte','stroop','odd'].indexOf(mode));
    assert(await row.locator('.journey-rating .lit').count() === 5, mode + ' perfect fast play must earn five stars');
  }
  assert(await page.locator('#dailySummary .journey-row').count() === 7, 'full recap must show every game');
  assert(!/分數|總分|評分|DAILY SCORE/.test(await page.locator('#dailyResult').innerText()), 'recap must not rank or score the player');
  await assertA11y(page, 'five-star ratings recap');
  await page.screenshot({path:'/tmp/brain7-chill-recap-mobile.png',fullPage:true});
  await exitToHome(page);
  await page.locator('#recentPlays > summary').click();
  assert((await page.locator('#historyList').innerText()).includes('完成 7 關'), 'history must record the full journey');
  await page.reload();
  await page.locator('#recentPlays > summary').click();
  assert((await page.locator('#historyList').innerText()).includes('完成 7 關'), 'history must survive reload');

  // Rest-page exit preserves completed ratings; recap can replay a single game.
  await page.locator('#dailyBtn').click();
  await page.clock.runFor(60050);
  await page.locator('#sessionBreak.active').waitFor();
  assert(await page.evaluate(() => document.activeElement === document.querySelector('#sessionBreak h2')), 'rest screen must receive keyboard focus');
  assert(await page.evaluate(() => !!localStorage.getItem('brain7-daily-checkpoint')), 'completed games should checkpoint remaining daily games');
  await page.reload();
  await page.locator('#resumeDailyBtn').waitFor({state:'visible'});
  await page.locator('#resumeDailyBtn').click();
  await acceptReady(page);
  await page.locator('#memory.active').waitFor();
  assert((await page.locator('#sessionContext').innerText()).includes('2 / 7'), 'resume should continue after the last completed game');
  await page.locator('#memory .back').click();
  await page.locator('#dailyResult.active').waitFor();
  assert((await page.locator('#dailyOverview').innerText()).includes('1 / 7'), 'resumed early exit must preserve one completed game');
  const savedMathRow=page.locator('#dailySummary .journey-row').first();
  await savedMathRow.locator('summary').click();
  assert((await savedMathRow.innerText()).includes('平均作答'),'saved game recap should retain its detailed performance data');
  assert(!(await page.evaluate(() => !!localStorage.getItem('brain7-daily-checkpoint'))), 'finished journey recap should clear its checkpoint');
  await savedMathRow.getByRole('button', {name:'再玩快速心算',exact:true}).click();
  await page.locator('#math.active').waitFor();
  assert((await page.locator('#sessionContext').innerText()).includes('隨心玩一關'), 'recap replay must be standalone');
  await exitToHome(page);

  // Leaving during a delayed next-question callback must cancel it.
  await page.locator('[data-mode="odd"]').click();
  await acceptReady(page);
  await page.locator('#odd.active').waitFor();
  await page.locator('#oddGrid [data-odd="true"]').click();
  await exitToHome(page);
  await page.clock.runFor(1000);
  assert(await page.locator('#home.active').isVisible(), 'old round callback must not restore a departed game');
  assert((await page.locator('#oddPill').textContent()).startsWith('1 / 16'), 'old round callback must not advance after leaving');
  await page.locator('#dailyBtn').click();
  await acceptReady(page);
  await page.locator('#math.active').waitFor();
  await page.locator('#finishEarlyBtn').click();
  await page.locator('#dailyResult.active').waitFor();
  assert(await page.locator('#dailyScore .lit').count() === 0, 'early session exit must not claim completed games');
  assert((await page.locator('#dailyResult .gamehead h2').innerText()) === '這次先玩到這裡', 'early session recap should describe an unfinished journey');
  await exitToHome(page);
  await page.locator('.audio-settings > summary').click();
  await page.locator('#musicVolume').evaluate(el => {el.value='25';el.dispatchEvent(new Event('input',{bubbles:true}))});
  assert((await page.locator('#musicValue').innerText()) === '25%', 'music control must update its visible value');
  await page.reload();
  assert(await page.locator('#musicVolume').inputValue() === '25', 'music preference must survive reload');
  await page.locator('.audio-settings > summary').click();
  await page.locator('#musicToggle').click();
  assert(await page.locator('#musicToggle').getAttribute('aria-pressed')==='true','music can be muted independently');
  assert(await page.locator('#effectsToggle').getAttribute('aria-pressed')==='false','muting music must not mute effects');
  await page.locator('#effectsToggle').click();
  await page.reload();
  assert(await page.locator('#musicToggle').getAttribute('aria-pressed')==='true' && await page.locator('#effectsToggle').getAttribute('aria-pressed')==='true','independent mute preferences must persist');
  assert(errors.length===0, 'runtime errors: '+errors.join('; '));
  await page.screenshot({path:'/tmp/brain7-chill-home-mobile.png',fullPage:true});
  await context.close();
}

async function runPhoneStage(browser) {
  for(const viewport of [{width:375,height:667},{width:390,height:844}]) {
    const context = await browser.newContext({viewport,reducedMotion:'reduce'});
    const page = await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.clock.install();
    await page.goto('http://127.0.0.1:4173/adult-brain-training/',{waitUntil:'networkidle'});
    for(const mode of ['math','memory','logic','executive','schulte','stroop','odd']) {
      await page.locator('[data-mode="'+mode+'"]').click();
      await acceptReady(page);
      await page.locator('#'+mode+'.active').waitFor();
      if(mode==='memory') {
        assert(await page.locator('#memoryAnswer').getAttribute('readonly')!==null,'memory must avoid opening the OS keyboard');
        await page.locator('#memoryStart').click();
        const digits=(await page.locator('#memoryNumber').innerText()).replace(/\s/g,'');
        await page.clock.runFor(6100);
        assert(await page.locator('#memoryKeys').isVisible(),'memory keypad must appear automatically after exposure');
        await page.locator('#memoryKeys button').filter({hasText:/^0$/}).click();
        await page.locator('#memoryKeys button').filter({hasText:/^0$/}).click();
        assert(await page.locator('#memoryAnswer').inputValue()==='00','keypad must preserve leading zeroes');
        await page.locator('#memoryKeys button').filter({hasText:/^←$/}).click();
        assert(await page.locator('#memoryAnswer').inputValue()==='0','delete key must remove only the last digit');
        await page.locator('#memoryKeys button').filter({hasText:/^清除$/}).click();
        for(const digit of digits) await page.keyboard.press(digit);
        assert(await page.locator('#memoryAnswer').inputValue()===digits,'physical keyboard must work without editing readonly input');
      }
      assert(await page.locator('.audio-settings').isVisible(),'audio controls must remain available during gameplay');
      const size=await page.evaluate(() => {
        const screen=document.querySelector('.screen.active'),panel=screen.querySelector('.panel'),r=screen.getBoundingClientRect();
        return {bottom:r.bottom,height:innerHeight,outer:document.documentElement.scrollHeight,scroll:scrollY,extra:panel.scrollHeight-panel.clientHeight};
      });
      assert(size.bottom<=size.height+1 && size.outer<=size.height+1 && size.scroll===0,mode+' must stay inside phone viewport '+JSON.stringify(size));
      assert(size.extra<=2,mode+' controls must fit without panel scrolling '+JSON.stringify(size));
      if(mode==='schulte') {
        const initial=await page.locator('#schulteGrid button').evaluateAll(nodes=>nodes.map(n=>n.dataset.number));
        await page.locator('#schulteGrid [data-number="1"]').click();
        await page.locator('#schulteGrid [data-number="2"]').click();
        const order=await page.locator('#schulteGrid button').evaluateAll(nodes=>nodes.map(n=>n.dataset.number));
        assert(initial.indexOf('1')===order.indexOf('1'),'completed number must remain pinned after multiple reshuffles');
        assert(await page.locator('#schulteGrid .done').count()===2,'completed targets must remain visible');
      }
      await assertA11y(page,'phone '+mode);
      await page.screenshot({path:'/tmp/brain7-chill-stage-'+viewport.height+'-'+mode+'.png',fullPage:true});
      if(mode==='memory') {
        for(let round=1;round<=9;round++) {
          await page.locator('#memorySubmit').click();
          await page.clock.runFor(950);
          const digits=(await page.locator('#memoryNumber').innerText()).replace(/\s/g,'');
          if(round>=8){
            const counts=await page.locator('#memoryNumber .memory-digit-row').evaluateAll(rows=>rows.map(row=>row.children.length));
            assert(counts.join(',')===(round===8?'4,4':'5,4'),'8/9-digit exposure must be balanced over two lines');
          }
          await page.clock.runFor(6100);
          const extra=await page.locator('#memory .panel').evaluate(el=>el.scrollHeight-el.clientHeight);
          assert(extra<=2,'long-digit memory and keypad must fit phone height; overflow '+extra);
          for(const digit of digits) await page.keyboard.press(digit);
        }
        await page.screenshot({path:'/tmp/brain7-chill-memory-nine-'+viewport.height+'.png',fullPage:true});
      }
      if(mode==='logic'||mode==='odd') {
        const rounds=mode==='logic'?9:15;
        for(let round=0;round<rounds;round++) {
          if(mode==='logic') {
            await page.locator('#logicChoices .choice').first().click();
                      await page.clock.runFor(300);
          } else {
            await page.locator('#oddGrid [data-odd="true"]').click();
            await page.clock.runFor(200);
          }
          const extra=await page.locator('#'+mode+' .panel').evaluate(el=>el.scrollHeight-el.clientHeight);
          assert(extra<=2,mode+' later question must fit the fixed phone stage; overflow '+extra);
        }
      }
      await exitToHome(page);
    }
    assert(errors.length===0,'phone runtime errors: '+errors.join('; '));
    await context.close();
  }
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
  await runPhoneStage(browser);
  console.log('browser-qa: PASS — 7 games, mobile + desktop, accessibility, and reduced-motion checks passed.');
} finally {
  await browser.close();
}

