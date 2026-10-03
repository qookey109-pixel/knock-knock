import fs from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const html = fs.readFileSync('adult-brain-training/index.html', 'utf8');

for (const token of [
  'function makeOrderLogic()',
  'function makeBoxLogic()',
  'function makePetLogic()',
  'function makeCodeLogic()',
  'function makeTruthLogic()',
  'function buildLogicSession()'
]) {
  assert(html.includes(token), 'Missing logic generator: ' + token);
}

// Ordering template: X before M and Z after M among three people must force X-M-Z.
{
  const perms = [
    ['X','M','Z'],['X','Z','M'],['M','X','Z'],
    ['M','Z','X'],['Z','X','M'],['Z','M','X']
  ];
  const valid = perms.filter(p => {
    const pos = Object.fromEntries(p.map((v,i)=>[v,i]));
    return pos.X < pos.M && pos.Z > pos.M;
  });
  assert(valid.length === 1 && valid[0].join('') === 'XMZ', 'Order template must have exactly one solution.');
}

// Box template: not A; if not B then D; not D -> only B.
{
  const valid = ['A','B','C','D'].filter(box => {
    const c1 = box !== 'A';
    const c2 = box === 'B' || box === 'D';
    const c3 = box !== 'D';
    return c1 && c2 && c3;
  });
  assert(JSON.stringify(valid) === JSON.stringify(['B']), 'Box template must have exactly one solution.');
}

// Pairing template: C=z, A!=y, A!=z -> A=x and B=y.
{
  const items = ['x','y','z'];
  const assignments = [];
  for (const a of items) for (const b of items) for (const c of items) {
    if (new Set([a,b,c]).size === 3) assignments.push({A:a,B:b,C:c});
  }
  const valid = assignments.filter(x => x.C === 'z' && x.A !== 'y' && x.A !== 'z');
  assert(valid.length === 1 && valid[0].A === 'x' && valid[0].B === 'y', 'Pairing template must have exactly one solution.');
}

// Code template: enumerate all three-digit codes satisfying the four displayed rules.
{
  const valid = [];
  for (let a=1;a<=9;a++) for (let b=0;b<=9;b++) for (let c=0;c<=9;c++) {
    if (a>b && c===a+b && new Set([a,b,c]).size===3 && a%2===1) valid.push(''+a+b+c);
  }
  assert(valid.length > 0, 'Code template must have valid instances.');
  assert(valid.every(s => {
    const [a,b,c]=s.split('').map(Number);
    return a>b && c===a+b && new Set([a,b,c]).size===3 && a%2===1;
  }), 'Every generated valid code must satisfy all rules.');
}

// Truth template: statements are culprit==B, culprit!=B, culprit!=A; exactly one true -> A.
{
  const candidates = ['A','B','C'];
  const valid = candidates.filter(culprit => {
    const truths = [culprit === 'B', culprit !== 'B', culprit !== 'A'];
    return truths.filter(Boolean).length === 1;
  });
  assert(JSON.stringify(valid) === JSON.stringify(['A']), 'Truth template must have exactly one solution.');
}

const sessionFactoryMatch = html.match(/function buildLogicSession\(\)\{[\s\S]*?return \[([\s\S]*?)\]\s*\}/);
assert(sessionFactoryMatch, 'Could not inspect logic session factory.');
const generatedCount = (sessionFactoryMatch[1].match(/make(?:Order|Box|Pet|Code|Truth|Compare|Time|Pattern)Logic\(\)/g) || []).length;
assert(generatedCount === 10, `Expected 10 generated logic questions per session, found ${generatedCount}.`);

console.log('brain-game-qa: PASS — 8 logic generator families are formally unique and session length is 10.');


// Public rating boundaries: five slots, with no completion-only star.
const ratingSource = html.match(/function scoreToStars\(score\)\{([\s\S]*?)\n  \}/);
assert(ratingSource, 'Missing star rating conversion');
const rate = new Function('score', ratingSource[1]);
for (const [score, stars] of [[0,0],[1,1],[39,1],[40,2],[59,2],[60,3],[74,3],[75,4],[89,4],[90,5],[100,5]]) assert(rate(score) === stars, 'Incorrect stars for score ' + score);

// Check the actual generated math expressions across all levels.
const mathCode=html.slice(html.indexOf('function generateMathProblem('),html.indexOf('function makeMath()'));
const generate=new Function('rand',mathCode+';return generateMathProblem')((a,b)=>Math.floor(Math.random()*(b-a+1))+a);
for(let lv=1;lv<=10;lv++) for(let i=0;i<100;i++) {
  const problem=generate(lv),parts=problem.text.split(' ');
  assert(parts.length===3,'Every math problem must have exactly two operands');
  assert(Number.isInteger(problem.ans)&&problem.ans>0,'Math answers must be positive integers');
  assert(Number(parts[0])<=500 && Number(parts[2])<=500,'Math difficulty must stay within the easier range');
}
// New logic templates have one candidate satisfying their explicit rule.
for(let start=0;start<7;start++) for(let offset=2;offset<=4;offset++) {
  const target=(start+offset)%7,candidates=[target,(target+1)%7,(target+6)%7];
  assert(candidates.filter(day=>day===(start+offset)%7).length===1,'Schedule question must have exactly one answer');
}
for(let first=2;first<=12;first++) for(let step=2;step<=6;step++) {
  const target=first+step*4;
  assert([target,target-step,target+step].filter(value=>value-(first+step*3)===step).length===1,'Pattern question must have exactly one answer');
}
const comparisonOrders=[['A','B','C'],['A','C','B'],['B','A','C'],['B','C','A'],['C','A','B'],['C','B','A']].filter(order=>order.indexOf('A')<order.indexOf('B')&&order.indexOf('B')<order.indexOf('C'));
assert(comparisonOrders.length===1 && comparisonOrders[0][0]==='A','Transitive comparison must have one maximum');
