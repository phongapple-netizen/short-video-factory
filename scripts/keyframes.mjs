import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, selectComposition, renderStill} from '@remotion/renderer';
// 导出关键帧（跳过有 bug 的标题审计，只看画面）
const ROOT = '/home/hatch/workspace/short-video-factory';
process.chdir(ROOT);
const id = process.argv[2] || 'SentenceStructure';
const frames = (process.argv[3] || '0').split(',').map(Number);
const dir = `out/${id}/keyframes`;
mkdirSync(dir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE});
try {
  const composition = await selectComposition({serveUrl, id, inputProps: {}, puppeteerInstance: browser});
  for (const f of frames) {
    const out = `${dir}/k${String(f).padStart(5, '0')}.png`;
    await renderStill({serveUrl, composition, frame: f, output: out, puppeteerInstance: browser, logLevel: 'error'});
    console.log('wrote', out);
  }
} finally {
  await browser.close({silent: true});
}
