import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// @ts-ignore
import { Selector, t } from 'testcafe';

import { Reporter } from "./reporter";

import { ReportResult } from './model';
import * as fs from 'fs';

const compareImages = require('resemblejs/compareImages');
const VISUAL_MAIN_DIR = process.cwd() + '/visual-check-testcafe/';
const SCREENSHOT_DIR = 'screenshots/';
const SCREENSHOT_BASELINE_DIR = 'baseline/';
const REPORT_DIR = '.reports/visual-check-testcafe/';
const ACTUAL_SCREENSHOT_DIR = 'tests/';
const DIFF_SCREENSHOT_DIR = 'diff/';

const MAX_DIFF_PERCENTAGE = process.env.MAX_DIFF_PERCENTAGE ? process.env.MAX_DIFF_PERCENTAGE : 0.1;

function createDirectoryIfNotExists(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}


export async function visualCheck(testController: typeof t, feature: string, element?: Selector): Promise<void> {
  // @ts-ignore
  const testCase = testController.testRun.test.name;

  const imgName = `${testCase}_${testController.browser.name}_${testController.browser.os.name}.png`;

  createDirectoryIfNotExists(resolve(REPORT_DIR, ACTUAL_SCREENSHOT_DIR, feature));
  createDirectoryIfNotExists(resolve(VISUAL_MAIN_DIR, SCREENSHOT_BASELINE_DIR, feature));
  createDirectoryIfNotExists(resolve(REPORT_DIR, DIFF_SCREENSHOT_DIR, feature));

  const actualScreenshotPath = resolve(SCREENSHOT_DIR, ACTUAL_SCREENSHOT_DIR, feature, imgName);
  const baselineScreenshotPath = resolve(VISUAL_MAIN_DIR, SCREENSHOT_BASELINE_DIR, feature, imgName);
  const diffScreenshotPath = resolve(REPORT_DIR, DIFF_SCREENSHOT_DIR, feature, imgName);
  const testScreenshotPath = resolve(REPORT_DIR, ACTUAL_SCREENSHOT_DIR, feature, imgName);

  if (element) {
    await testController.takeElementScreenshot(element, ACTUAL_SCREENSHOT_DIR + feature + '/' + imgName);
  } else {
    await testController.takeScreenshot({ path: ACTUAL_SCREENSHOT_DIR + feature + '/' + imgName, fullPage: true });
  }

  if (!existsSync(baselineScreenshotPath)) {
    copyFileSync(actualScreenshotPath, baselineScreenshotPath);
    await testController.expect('no baseline').notOk('visual-check-testcafe no baseline present,' +
      ' saving actual element screenshot as baseline for next run');
  }
  copyFileSync(actualScreenshotPath, testScreenshotPath);

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
    readFileSync(baselineScreenshotPath),
    readFileSync(actualScreenshotPath),
    options
  );

  writeFileSync(diffScreenshotPath, result.getBuffer());

  // write combined image to testScreenshot for reporting
  await Reporter.createReportImage(baselineScreenshotPath, actualScreenshotPath, diffScreenshotPath);
  const errorMessage = `Element screenshot difference greater then max diff percentage: expected
     ${result.rawMisMatchPercentage} to be less or equal to ${MAX_DIFF_PERCENTAGE}`;

  const compareOk = result.rawMisMatchPercentage <= MAX_DIFF_PERCENTAGE;
  const compareResult = compareOk ? 'passed' : 'failed';
  const reportResult: ReportResult = {
    result: compareResult,
    name: testCase,
    browser: testController.browser.name,
    os: testController.browser.os.name,
    details: [{
      baseImgPath: './../../visual-check-testcafe/'+SCREENSHOT_BASELINE_DIR+'/'+feature+'/'+imgName,
      diffImgPath: DIFF_SCREENSHOT_DIR+feature+'/'+imgName,
      actualImgPath: ACTUAL_SCREENSHOT_DIR+feature+'/'+imgName
    }]
  };
  const reportResultPath = resolve(REPORT_DIR, 'results.txt');
  fs.writeFileSync(reportResultPath, JSON.stringify(reportResult)+'\n', { 'flag': 'a' });
  await Reporter.createHTMLReport(REPORT_DIR);
  await testController.expect(compareOk).ok(errorMessage);
}

