// Runs the end-to-end scripts one after another. `pnpm e2e` runs all,
// `pnpm e2e library` runs those whose name contains "library".

import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const skip = new Set(['harness.mjs', 'run.mjs']);
const wanted = process.argv.slice(2);
const scripts = readdirSync(here)
  .filter((f) => f.endsWith('.mjs') && !skip.has(f))
  .filter((f) => !wanted.length || wanted.some((w) => f.includes(w)))
  .sort();

let failed = 0;
for (const script of scripts) {
  console.log(`\n── ${script} ──`);
  const result = spawnSync(process.execPath, [join(here, script)], { stdio: 'inherit', timeout: 300000 });
  if (result.status !== 0) failed++;
}
console.log(failed ? `\n${failed} of ${scripts.length} scripts failed` : `\nAll ${scripts.length} scripts passed`);
process.exit(failed ? 1 : 0);
