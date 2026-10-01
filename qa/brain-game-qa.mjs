import fs from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const html = fs.readFileSync('adult-brain-training/index.html', 'utf8');

assert(html.includes("clues:['阿明：是小美拿的。','小美：不是小美拿的。','阿哲：不是阿明拿的。']"), 'Puzzle 1 source does not match the formal QA model.');
assert(html.includes("clues:['A 不站第一個。','C 站在 A 的前面。','B 不站中間。']"), 'Puzzle 2 source does not match the formal QA model.');
assert(html.includes("clues:['第一位比第二位大。','第三位等於前兩位相加。','三個數字都不同。','第一位是奇數。']"), 'Puzzle 3 source does not match the formal QA model.');

// Puzzle 1: exactly one statement is true.
{
  const candidates = [0, 1, 2]; // 阿明、小美、阿哲
  const solutions = candidates.filter(culprit => {
    const truths = [
      culprit === 1, // 阿明：是小美拿的
      culprit !== 1, // 小美：不是小美拿的
      culprit !== 0  // 阿哲：不是阿明拿的
    ];
    return truths.filter(Boolean).length === 1;
  });
  assert(JSON.stringify(solutions) === JSON.stringify([0]), 'Puzzle 1 must have exactly one solution: 阿明.');
}

// Puzzle 2: enumerate all permutations.
{
  const perms = [
    ['A','B','C'],['A','C','B'],['B','A','C'],
    ['B','C','A'],['C','A','B'],['C','B','A']
  ];
  const valid = perms.filter(p => {
    const pos = Object.fromEntries(p.map((v,i)=>[v,i]));
    return pos.A !== 0 && pos.C < pos.A && pos.B !== 1;
  });
  assert(valid.length === 1 && valid[0][1] === 'A', 'Puzzle 2 must have one valid order with A in the middle.');
}

// Puzzle 3: evaluate every visible choice independently.
{
  const choices = ['213','325','426'];
  const valid = choices.filter(s => {
    const [a,b,c] = s.split('').map(Number);
    return a > b && c === a + b && new Set([a,b,c]).size === 3 && a % 2 === 1;
  });
  assert(JSON.stringify(valid) === JSON.stringify(['325']), 'Puzzle 3 must have exactly one valid choice: 325.');
}

// Puzzle 4: model the implication literally.
{
  const valid = [1,2,3,4].filter(box => {
    const c1 = box !== 1;
    const c2 = box === 2 || box === 4; // if not 2, then 4
    const c3 = box !== 4;
    return c1 && c2 && c3;
  });
  assert(JSON.stringify(valid) === JSON.stringify([2]), 'Puzzle 4 must have exactly one solution: box 2.');
}

// Puzzle 5: enumerate pet assignments.
{
  const pets = ['貓','狗','魚'];
  const perms = [];
  for (const a of pets) for (const b of pets) for (const c of pets) {
    if (new Set([a,b,c]).size === 3) perms.push({王:a,李:b,陳:c});
  }
  const valid = perms.filter(x => x.王 !== '狗' && x.陳 === '魚' && x.王 !== '魚');
  assert(valid.length === 1 && valid[0].李 === '狗', 'Puzzle 5 must have exactly one solution: 小李養狗.');
}

const questionCount = (html.match(/\{q:'/g) || []).length;
assert(questionCount === 5, `Expected 5 logic puzzles, found ${questionCount}.`);

console.log('brain-game-qa: PASS — 5/5 logic puzzles have independently verified unique solutions.');
