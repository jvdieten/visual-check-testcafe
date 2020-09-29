import { copyFileSync, createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import { createCanvas, loadImage } from 'canvas';
// @ts-ignore
import { Selector, t } from 'testcafe';

const compareImages = require('resemblejs/compareImages');

const VISUAL_MAIN_DIR = 'test/screenshots/';
const SCREENSHOT_BASELINE_DIR = 'baseline/';
const SCREENSHOT_REPORT_DIR = '.reports/e2e/screenshots/';
const ACTUAL_SCREENSHOT_DIR = 'tests/';
const DIFF_SCREENSHOT_DIR = 'diff/';

const MAX_DIFF_PERCENTAGE = process.env.MAX_DIFF_PERCENTAGE ? process.env.MAX_DIFF_PERCENTAGE : 0.1;

function createDirectoryIfNotExists(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

async function createReportImage(baselineScreenshotPath: string, testScreenshotPath: string, diffScreenshotPath: string): Promise<void> {
  const baselineImage = await loadImage(baselineScreenshotPath);
  const testImage = await loadImage(testScreenshotPath);
  const diffImage = await loadImage(diffScreenshotPath);

  const { width, height } = baselineImage;

  const canvas = createCanvas(width * 3, height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(baselineImage, 0, 0, width, height);
  ctx.drawImage(testImage, width, 0, width, height);
  ctx.drawImage(diffImage, 2 * width, 0, width, height);

  // add header
  ctx.font = '15px Impact';
  ctx.fillText('Baseline', 0, 12);
  ctx.fillText('Actual', width, 12);
  ctx.fillText('Diff', width * 2, 12);

  const out = createWriteStream(testScreenshotPath);
  const stream = canvas.createPNGStream();

  stream.pipe(out);
}

export async function visualCompare(testController: typeof t, element: Selector, feature: string): Promise<void> {
  // @ts-ignore
  const testCase = testController.testRun.test.name;

  const imgName = `${testCase}_${testController.browser.name}_${testController.browser.os.name}.png`;

  createDirectoryIfNotExists(resolve(SCREENSHOT_REPORT_DIR, ACTUAL_SCREENSHOT_DIR, feature));
  createDirectoryIfNotExists(resolve(VISUAL_MAIN_DIR, SCREENSHOT_BASELINE_DIR, feature));
  createDirectoryIfNotExists(resolve(SCREENSHOT_REPORT_DIR, DIFF_SCREENSHOT_DIR, feature));

  const actualScreenshotPath = resolve(SCREENSHOT_REPORT_DIR, ACTUAL_SCREENSHOT_DIR, feature, imgName);
  const baselineScreenshotPath = resolve(VISUAL_MAIN_DIR, SCREENSHOT_BASELINE_DIR, feature, imgName);
  const diffScreenshotPath = resolve(SCREENSHOT_REPORT_DIR, DIFF_SCREENSHOT_DIR, feature, imgName);

  await testController.takeElementScreenshot(element, ACTUAL_SCREENSHOT_DIR + feature + '/' + imgName);

  if (!existsSync(baselineScreenshotPath)) {
    copyFileSync(actualScreenshotPath, baselineScreenshotPath);
    await testController.expect('no baseline').ok('Visual compare No baseline present,' +
      ' saving actual element screenshot as baseline');
  }

  const options = {
    ignore: 'antialiasing',
    output: {
      errorColor: {
        blue: 255,
        green: 0,
        red: 255
      },
      errorType: 'movement',
      outputDiff: true
    },
    scaleToSameSize: true
  };

  // compare images
  const result = await compareImages(
    await readFileSync(baselineScreenshotPath),
    await readFileSync(actualScreenshotPath),
    options
  );

  writeFileSync(diffScreenshotPath, result.getBuffer());

  // write combined image to testScreenshot for reporting
  await createReportImage(baselineScreenshotPath, actualScreenshotPath, diffScreenshotPath);
  const errorMessage = `Element screenshot difference greater then max diff percentage: expected
     ${result.rawMisMatchPercentage} to be less or equal to ${MAX_DIFF_PERCENTAGE}`;
  await testController.expect(result.rawMisMatchPercentage <= MAX_DIFF_PERCENTAGE).ok(errorMessage);

}
