import fs from 'fs';
import path from 'path';

export function loadEnvLocal() {
  try {
    let dir = process.cwd();
    let envPath = path.join(dir, '.env.local');

    while (!fs.existsSync(envPath)) {
      const parentDir = path.dirname(dir);
      if (parentDir === dir) return;
      dir = parentDir;
      envPath = path.join(dir, '.env.local');
    }

    const contents = fs.readFileSync(envPath, 'utf8');
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const match = trimmed.match(/^([A-Za-z0-9_]+)=(.*)$/);
      if (!match) continue;

      const [, key, value] = match;
      if (process.env[key] !== undefined) continue;

      let parsedValue = value.trim();
      if (parsedValue.startsWith('"') && parsedValue.endsWith('"')) {
        parsedValue = parsedValue.slice(1, -1);
      }

      process.env[key] = parsedValue;
    }
  } catch {
    // ignore loading errors; Next.js should still provide envs normally
  }
}
