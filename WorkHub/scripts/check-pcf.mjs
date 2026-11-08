import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

await mkdir('test-results', { recursive: true });
await writeFile('test-results/pcf-host.html', '<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>PCF 로컬 호스트 검증</title></head><body style="margin:0"><div id="host"></div></body></html>');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const checks = [];
const check = (name, condition) => { assert.ok(condition, name); checks.push(name); };
try {
  await page.goto(pathToFileURL(resolve('test-results/pcf-host.html')).href);
  await page.addStyleTag({ path: 'out/controls/WorkHub/css/WorkHub.css' });
  await page.addScriptTag({ path: 'out/controls/WorkHub/bundle.js' });
  await page.evaluate(() => {
    window.pcfInstance = new window.VibeStudio.WorkHub();
    window.outputNotifications = 0;
    window.resizeTracking = false;
    window.hostContext = { parameters: { userName: { raw: '김민서' }, readOnly: { raw: false } }, mode: { allocatedHeight: 1100, allocatedWidth: 1440, isControlDisabled: false, trackContainerResize: enabled => { window.resizeTracking = enabled; } } };
    window.pcfInstance.init(window.hostContext, () => { window.outputNotifications++; }, {}, document.getElementById('host'));
  });
  await page.locator('.wh-kpi').first().waitFor();
  check('실제 PCF bundle 초기화 및 렌더링', await page.getByRole('heading', { name: '통합 대시보드.' }).isVisible());
  check('호스트 크기 추적', await page.evaluate(() => window.resizeTracking && document.getElementById('host').style.height === '1100px'));
  await page.screenshot({ path: 'test-results/07-pcf-host.png' });
  await page.getByRole('navigation').getByRole('button', { name: '전체 업무', exact: true }).click();
  await page.locator('.wh-task-link').first().click();
  await page.getByRole('dialog').waitFor();
  check('선택 ID 출력과 알림', await page.evaluate(() => /^WH-\d+$/.test(window.pcfInstance.getOutputs().selectedId) && window.outputNotifications === 1));
  await page.evaluate(() => { window.hostContext.parameters.readOnly.raw = true; window.pcfInstance.updateView(window.hostContext); });
  await page.getByRole('combobox', { name: '상태 변경' }).waitFor({ state: 'detached' });
  check('readOnly 속성 갱신 반영', await page.getByRole('textbox', { name: '댓글 입력' }).count() === 0);
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await page.evaluate(() => { window.hostContext.parameters.readOnly.raw = false; window.hostContext.mode.isControlDisabled = true; window.hostContext.mode.allocatedHeight = 800; window.pcfInstance.updateView(window.hostContext); });
  await page.waitForFunction(() => document.getElementById('host').style.height === '800px');
  check('Canvas 비활성화·크기 갱신 반영', await page.getByRole('button', { name: '새 업무 등록', exact: true }).count() === 0);
  await page.evaluate(() => window.pcfInstance.destroy());
  check('destroy 시 렌더 트리 해제', await page.locator('#host').innerHTML() === '');
  check('PCF 로컬 호스트 브라우저 오류 없음', errors.length === 0);
  await writeFile('test-results/pcf-result.json', JSON.stringify({ passed: checks.length, checks, errors, note: '로컬 모의 호스트에서 실제 빌드 bundle을 실행한 결과이며 Power Apps Studio 실행 검증을 대체하지 않습니다.' }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally { await browser.close(); }
