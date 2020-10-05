import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// @ts-ignore
import { Selector, t } from 'testcafe';

import { Reporter } from './reporter';

import { ReportResult, resembleOptions } from './model';

const compareImages = require('resemblejs/compareImages');
const VISUAL_MAIN_DIR = process.cwd() + '/visual-check-testcafe/';
const SCREENSHOT_DIR = 'screenshots/';
const SCREENSHOT_BASELINE_DIR = 'baseline/';
const REPORT_DIR = '.reports/visual-check-testcafe/';
const ACTUAL_SCREENSHOT_DIR = 'tests/';
const DIFF_SCREENSHOT_DIR = 'diff/';

const MAX_DIFF_PERCENTAGE = process.env.MAX_DIFF_PERCENTAGE ? process.env.MAX_DIFF_PERCENTAGE : 0.1;
const isSetupBaseline = process.argv.slice(2).indexOf('--setup-baseline') >= 0 ? true : false;

// for holding report results
export let reportResults: ReportResult[] = [];

function createDirectory(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export async function visualCheck(testController: typeof t, label?: string, element?: Selector): Promise<void> {
  // @ts-ignore no typings
  const testCase = testController.testRun.test.name;
  // @ts-ignore no typings
  const fixtureName = testController.testRun.test.testFile.currentFixture.name;
  if (!label) {
    label = fixtureName;
  }

  const imgName = `${testCase}_${testController.browser.name}_${testController.browser.os.name}.png`;

  createDirectory(resolve(REPORT_DIR, ACTUAL_SCREENSHOT_DIR, label));
  createDirectory(resolve(VISUAL_MAIN_DIR, SCREENSHOT_BASELINE_DIR, label));
  createDirectory(resolve(REPORT_DIR, DIFF_SCREENSHOT_DIR, label));

  const actualScreenshotPath = resolve(SCREENSHOT_DIR, ACTUAL_SCREENSHOT_DIR, label, imgName);
  const baselineScreenshotPath = resolve(VISUAL_MAIN_DIR, SCREENSHOT_BASELINE_DIR, label, imgName);
  const diffScreenshotPath = resolve(REPORT_DIR, DIFF_SCREENSHOT_DIR, label, imgName);
  const testScreenshotPath = resolve(REPORT_DIR, ACTUAL_SCREENSHOT_DIR, label, imgName);

  // take element screenshot OR full page screen if element not provided
  if (element) {
    await testController.takeElementScreenshot(element, ACTUAL_SCREENSHOT_DIR + label + '/' + imgName);
  } else {
    await testController.takeScreenshot({ path: ACTUAL_SCREENSHOT_DIR + label + '/' + imgName, fullPage: true });
  }

  if (isSetupBaseline) {
    copyFileSync(actualScreenshotPath, baselineScreenshotPath);
    console.log(`visual-check-testcafe: Baseline ${baselineScreenshotPath} created`);
    return;
  }

  if (!existsSync(baselineScreenshotPath)) {
    copyFileSync(actualScreenshotPath, baselineScreenshotPath);
    await testController.expect('no baseline').notOk('visual-check-testcafe: no baseline present,' +
      ' storing baseline for next run');
  }
  copyFileSync(actualScreenshotPath, testScreenshotPath);

  const result = await compareImages(
    readFileSync(baselineScreenshotPath),
    readFileSync(actualScreenshotPath),
    resembleOptions
  );

  writeFileSync(diffScreenshotPath, result.getBuffer());

  // write combined image to testScreenshot for reporting
  await Reporter.createReportImage(baselineScreenshotPath, actualScreenshotPath, diffScreenshotPath);
  const errorMessage = `Element screenshot difference greater then max diff percentage: expected
     ${result.rawMisMatchPercentage} to be less or equal to ${MAX_DIFF_PERCENTAGE}`;

  const compareOk = result.rawMisMatchPercentage <= MAX_DIFF_PERCENTAGE;
  const compareResult = compareOk ? 'passed' : 'failed';
  const reportResult: ReportResult = {
    status: compareResult,
    name: testCase,
    fixtureName: fixtureName,
    browser: testController.browser.name,
    misMatchPercentage: result.rawMisMatchPercentage,
    os: testController.browser.os.name,
    details: [{
      baseImgPath: './../../visual-check-testcafe/' + SCREENSHOT_BASELINE_DIR + '/' + label + '/' + imgName,
      diffImgPath: DIFF_SCREENSHOT_DIR + label + '/' + imgName,
      actualImgPath: ACTUAL_SCREENSHOT_DIR + label + '/' + imgName
    }]
  };
  reportResults.push(reportResult);

  await Reporter.createHTMLReport(REPORT_DIR, reportResults);
  await testController.expect(compareOk).ok(errorMessage);
}

