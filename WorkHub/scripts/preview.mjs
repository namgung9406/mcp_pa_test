import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
const result = await build({ entryPoints: ['preview/index.tsx'], bundle: true, minify: true, format: 'iife', write: false, define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'eof' });
const script = result.outputFiles[0].text.replaceAll('</script', '<\\/script');
const css = await readFile('WorkHub/css/WorkHub.css', 'utf8');
await writeFile('dist/WorkHub-미리보기.html', `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WorkHub · 통합 업무 허브</title><style>html,body{margin:0;height:100%;}#app{height:100vh;min-height:580px;}${css}</style></head><body><div id="app" class="wh-root"></div><script>${script}</script></body></html>`, 'utf8');
console.log('미리보기 HTML 생성 완료');
