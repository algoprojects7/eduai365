#!/usr/bin/env node
/**
 * Removes stale Next.js dev caches that cause "Internal Server Error"
 * / "missing required error components" after failed builds.
 */
import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const appsDir = join(process.cwd(), 'apps');

const nextApps = [
  'web-landing',
  'web-admin',
  'web-school',
  'web-teacher',
  'web-student',
  'web-parent',
];

for (const app of nextApps) {
  const nextDir = join(appsDir, app, '.next');
  if (existsSync(nextDir)) {
    rmSync(nextDir, { recursive: true, force: true });
    console.log(`Removed ${app}/.next`);
  }
}

console.log('Dev cache clean complete.');
