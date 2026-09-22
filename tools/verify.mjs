/**
 * Load the demo in a real headless browser and check that it works.
 *
 * Serves the project locally and drives it with the same minimal Chrome
 * driver the grid's own test suite uses (tools/browser.js), so this needs no
 * dependency beyond Chrome itself.
 *
 * Checks:
 *   - the library arrived and left the LatticeGrid global behind;
 *   - all 12 stock items land in the grid;
 *   - starting an edit by keyboard (focus the cell, press Enter), typing a
 *     valid Quantity and pressing Enter changes the cell's value and logs
 *     one accepted edit;
 *   - typing an out-of-range Quantity and pressing Enter does NOT change the
 *     value, marks the cell invalid (aria-invalid + the grid's own invalid
 *     class) and does not add a second logged edit;
 *   - nothing logged a console error or threw while the page ran.
 *
 * Exits non-zero on any failure, so it can gate a deployment.
 *
 * Usage: node tools/verify.mjs
 */

import { startServer } from './serve.mjs';
import { Browser, available } from './browser.js';

if (!available()) {
  console.log('No headless browser on this machine; skipping verify.mjs.');
  process.exit(0);
}

const ROW_KEY = 'SKU-01';
const COL = 'quantity';

const { server, port } = await startServer();
const browser = new Browser();

try {
  await browser.start();

  await browser.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      window.__errs = [];
      addEventListener('error', (e) => window.__errs.push(String(e.message || e)));
      addEventListener('unhandledrejection', (e) => window.__errs.push('unhandledrejection: ' + String(e.reason)));
      const origError = console.error.bind(console);
      console.error = (...args) => { window.__errs.push('console.error: ' + args.map(String).join(' ')); origError(...args); };
    `,
  });

  await browser.open(`http://127.0.0.1:${port}/`);
  await new Promise((r) => setTimeout(r, 500));

  const failures = [];

  const hasGrid = await browser.evaluate(`typeof LatticeGrid !== 'undefined' && typeof LatticeGrid.createGrid === 'function'`);
  if (!hasGrid) failures.push('LatticeGrid.createGrid was not found on the page');

  const itemCount = await browser.evaluate(`window.__demoGrid.rows.matchCount()`);
  if (itemCount !== 12) failures.push(`expected 12 stock items, grid reports ${itemCount}`);

  const cellSelector = `document.querySelector('.lat-row[data-key="${ROW_KEY}"] .lat-cell[data-col="${COL}"]')`;

  // Helper run in-page: focus the cell (mousedown+click, as a pointer would),
  // press Enter to open the editor by keyboard, set the editor's value, and
  // press Enter again to commit. Returns whether an editor was ever found.
  async function editViaKeyboard(value) {
    return browser.evaluate(`(() => {
      const cell = ${cellSelector};
      if (!cell) return { ok: false, reason: 'cell not found' };
      cell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      cell.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      cell.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      cell.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const input = cell.querySelector('.lat-editor__input');
      if (!input) return { ok: false, reason: 'no editor input opened' };
      input.value = ${JSON.stringify(value)};
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      return { ok: true };
    })()`);
  }

  const beforeValue = await browser.evaluate(`window.__demoGrid.rows.value('${ROW_KEY}', '${COL}')`);

  // Step 1: a valid edit, by keyboard only.
  const validResult = await editViaKeyboard('75');
  await new Promise((r) => setTimeout(r, 200));
  if (!validResult.ok) failures.push(`starting the edit failed: ${validResult.reason}`);
  const afterValid = await browser.evaluate(`window.__demoGrid.rows.value('${ROW_KEY}', '${COL}')`);
  if (afterValid !== 75) failures.push(`expected Quantity 75 after a valid edit, grid reports ${afterValid} (was ${beforeValue})`);

  const logCountAfterValid = await browser.evaluate(`document.querySelectorAll('#log li').length`);
  if (logCountAfterValid !== 1) failures.push(`expected 1 logged accepted edit after the valid commit, found ${logCountAfterValid}`);

  // Step 2: an out-of-range edit (max is 500), by keyboard only.
  const invalidResult = await editViaKeyboard('9999');
  await new Promise((r) => setTimeout(r, 200));
  if (!invalidResult.ok) failures.push(`starting the second edit failed: ${invalidResult.reason}`);
  const afterInvalid = await browser.evaluate(`window.__demoGrid.rows.value('${ROW_KEY}', '${COL}')`);
  if (afterInvalid !== 75) failures.push(`an out-of-range Quantity was written: grid reports ${afterInvalid}, expected it to stay 75`);

  const invalidMark = await browser.evaluate(`(() => {
    const cell = ${cellSelector};
    if (!cell) return null;
    return { hasClass: cell.classList.contains('lat-invalid'), ariaInvalid: cell.getAttribute('aria-invalid') };
  })()`);
  if (!invalidMark || !invalidMark.hasClass) failures.push(`the cell was not marked with the grid's invalid class (lat-invalid) after the refused edit (${JSON.stringify(invalidMark)})`);
  if (!invalidMark || invalidMark.ariaInvalid !== 'true') failures.push(`the cell did not carry aria-invalid="true" after the refused edit (${JSON.stringify(invalidMark)})`);

  const logCountAfterInvalid = await browser.evaluate(`document.querySelectorAll('#log li').length`);
  if (logCountAfterInvalid !== 1) failures.push(`a refused edit should not add a logged entry; found ${logCountAfterInvalid} (expected still 1)`);

  const errors = await browser.evaluate('window.__errs');
  if (errors.length) failures.push(`console/window errors: ${errors.join(' | ')}`);

  if (failures.length) {
    console.error('FAILED:\n' + failures.map((f) => `  - ${f}`).join('\n'));
    process.exitCode = 1;
  } else {
    console.log(
      'OK: 12 stock items loaded, a keyboard-driven edit to a valid Quantity (75) committed and logged, ' +
      'an out-of-range Quantity (9999) was refused (value unchanged, lat-invalid + aria-invalid present, ' +
      'no extra log entry), 0 console errors.'
    );
  }
} finally {
  await browser.close();
  server.close();
}
