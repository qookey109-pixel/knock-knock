import fs from 'node:fs';

const paths = process.argv.slice(2);
if (!paths.length) paths.push('/tmp/lighthouse.json');

const reports = paths.map(path => JSON.parse(fs.readFileSync(path, 'utf8')));
const thresholds = {
  performance: 0.90,
  accessibility: 0.90,
  'best-practices': 0.90,
  seo: 0.90
};

function median(values) {
  const sorted = values.slice().sort((a,b) => a-b);
  return sorted[Math.floor(sorted.length / 2)];
}

let failed = false;
for (const [name, min] of Object.entries(thresholds)) {
  const scores = reports.map(r => r.categories?.[name]?.score).filter(v => typeof v === 'number');
  if (scores.length !== reports.length) {
    console.error(`lighthouse-qa: missing category ${name} in one or more reports`);
    failed = true;
    continue;
  }
  const med = median(scores);
  const runText = scores.map(s => Math.round(s * 100)).join('/');
  console.log(`lighthouse-qa: ${name} runs = ${runText}; median = ${Math.round(med * 100)} (minimum ${Math.round(min * 100)})`);
  if (med < min) failed = true;
  if (name === 'performance' && Math.min(...scores) < 0.80) {
    console.error('lighthouse-qa: performance hard floor breached (<80) in at least one run.');
    failed = true;
  }
}

if (failed) {
  console.error('lighthouse-qa: FAIL — median thresholds or hard floor not met.');
  process.exit(1);
}
console.log('lighthouse-qa: PASS — median cloud quality thresholds met.');
