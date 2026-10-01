import fs from 'node:fs';

const reportPath = process.argv[2] || '/tmp/lighthouse.json';
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const categories = report.categories || {};

const thresholds = {
  performance: 0.90,
  accessibility: 0.90,
  'best-practices': 0.90,
  seo: 0.90
};

let failed = false;
for (const [name, min] of Object.entries(thresholds)) {
  const score = categories[name]?.score;
  if (typeof score !== 'number') {
    console.error(`lighthouse-qa: missing category ${name}`);
    failed = true;
    continue;
  }
  const pct = Math.round(score * 100);
  console.log(`lighthouse-qa: ${name} = ${pct} (minimum ${Math.round(min * 100)})`);
  if (score < min) failed = true;
}

if (failed) {
  console.error('lighthouse-qa: FAIL — one or more category scores are below threshold.');
  process.exit(1);
}
console.log('lighthouse-qa: PASS — all category scores meet cloud gate thresholds.');
