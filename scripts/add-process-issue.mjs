import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const VALID_TYPES = new Set([
  'ambiguity',
  'doc-drift',
  'missing-step',
  'verification-gap',
  'ownership-gap',
  'tooling-gap',
  'structure-gap',
  'safety-risk',
  'overhead',
]);

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) {
    return null;
  }
  return process.argv[index + 1];
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const description = readArg('-d');
const processName = readArg('-p');
const type = readArg('-t');

if (!description) {
  fail('Missing required -d <description>.');
}

if (!processName) {
  fail('Missing required -p <process>.');
}

if (!type) {
  fail('Missing required -t <type>.');
}

if (!VALID_TYPES.has(type)) {
  fail(`Invalid -t value. Expected one of: ${Array.from(VALID_TYPES).join(', ')}`);
}

const targetPath = resolve('workflows/process-issue-log.md');
if (!existsSync(targetPath)) {
  fail(`Missing issue log at ${targetPath}`);
}

const now = new Date();
const iso = now.toISOString();
const compactDate = iso.slice(0, 10).replace(/-/g, '');
const compactTime = iso.slice(11, 19).replace(/:/g, '');
const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
const id = `PI-${compactDate}-${compactTime}-${milliseconds}`;

const entry = [
  '',
  `- ID: ${id}`,
  '  Status: open',
  `  Type: ${type}`,
  `  Process: ${processName}`,
  `  Reported: ${iso}`,
  `  Description: ${description.trim()}`,
  '',
].join('\n');

const current = readFileSync(targetPath, 'utf8');
const marker = '## Open Issues';
const index = current.indexOf(marker);

if (index === -1) {
  fail(`Could not find "${marker}" in ${targetPath}`);
}

const insertionPoint = current.indexOf('\n', index + marker.length);
const withEntry =
  current.slice(0, insertionPoint + 1) +
  entry +
  current.slice(insertionPoint + 1);

const updated = withEntry.replace(
  /\*\*Last Updated:\*\* .*/,
  `**Last Updated:** ${iso.slice(0, 10)}`,
);

writeFileSync(targetPath, updated);
console.log(`Added process issue ${id} to workflows/process-issue-log.md`);
