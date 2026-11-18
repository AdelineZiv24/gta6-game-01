import { createReadStream, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const output = resolve(fileURLToPath(new URL('./screenshots', import.meta.url)));
const port = 4176;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = resolve(join(root, pathname === '/' ? 'index.html' : pathname));
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) { response.writeHead(404).end(); return; }
  response.writeHead(200, { 'content-type': `${mime[extname(file)] || 'application/octet-stream'}; charset=utf-8` });
  createReadStream(file).pipe(response);
});

const playwrightPackage = process.env.PLAYWRIGHT_PACKAGE || '../tools/playwright/node_modules/playwright';
const playwrightModule = playwrightPackage.endsWith('.js') ? playwrightPackage : `${playwrightPackage}/index.js`;
const playwrightNamespace = await import(playwrightModule);
const chromium = playwrightNamespace.chromium ?? playwrightNamespace.default?.chromium;
if (!chromium) throw new Error(`Playwright module '${playwrightModule}' does not export chromium`);
mkdirSync(output, { recursive: true });
for (const file of readdirSync(output)) rmSync(join(output, file));
await new Promise((resolveServer, rejectServer) => {
  server.once('error', rejectServer);
  server.listen(port, '127.0.0.1', () => { server.removeListener('error', rejectServer); resolveServer(); });
});
const browser = await chromium.launch({ headless: true });
const scenes = [
  ['1-start.jpg', 'start'],
  ['2-mission.jpg', 'mission'],
  ['3-foot.jpg', 'foot'],
  ['4-chase.jpg', 'chase'],
];
try {
  for (const [name, shot] of scenes) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`http://127.0.0.1:${port}/?shot=${shot}&seed=1`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    let quality = 72;
    const target = join(output, name);
    do {
      await page.screenshot({ path: target, type: 'jpeg', quality });
      quality -= 8;
    } while (statSync(target).size > 262144 && quality >= 24);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
writeFileSync('shots.json', `${JSON.stringify(scenes.map(([name, shot]) => ({ name, query: `?shot=${shot}&seed=1` })), null, 2)}\n`);
