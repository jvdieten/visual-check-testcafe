import { createWriteStream } from 'fs';
import { createCanvas, loadImage } from 'canvas';
import * as fs from 'fs';
import * as handlebars from 'handlebars';

import { AggregatedReportResult, Report, ReportResult } from './model';

export abstract class Reporter {

  static async createReportImage(baselineScreenshotPath: string, testScreenshotPath: string, diffScreenshotPath: string): Promise<void> {
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
    ctx.font = '16px Arial';
    ctx.fillText('Baseline', 0, 12);
    ctx.fillText('Actual', width, 12);
    ctx.fillText('Diff', width * 2, 12);

    const out = createWriteStream(testScreenshotPath);
    const stream = canvas.createPNGStream();

    stream.pipe(out);
  }

  static createHTMLReport(reportDir: string, reportResults: ReportResult[]) {

    const aggregatedReportResult: AggregatedReportResult[] = aggregateResultsByName(reportResults);

    let data: Report = {
      total: reportResults.length,
      results: aggregatedReportResult
    };

    const template = fs.readFileSync(__dirname + '/html-report-template.html', 'utf8');
    const compiledTemplate = handlebars.compile(template, {});
    const html = compiledTemplate(data);
    fs.writeFileSync(reportDir + 'report.html', html, 'utf8');
  }
}


function aggregateResultsByName(reportResults: ReportResult[]): AggregatedReportResult[] {
  const aggregatedResults: AggregatedReportResult[] = [];
  let currentName: string;
  let totalPassed = 0;
  let totalFailed = 0;
  let aggregatedIndex = 0;
  let testIndex = 0;
  let groupedResults: ReportResult[] = [];

  const sortedReportResults = sortReportItemsByTestName(reportResults);

  for (let i = 0; i < sortedReportResults.length; i++) {
    const result = sortedReportResults[i];
    if (!currentName) {
      currentName = result.name;
    }
    if (result.status === 'passed') {
      totalPassed++;
    }
    if (result.status === 'failed') {
      totalFailed++;
    }
    result.index = testIndex;
    groupedResults.push(result);
    if (result.name === currentName) {
      //handle last result or last aggregated item and push to result array
      if (i === sortedReportResults.length - 1
        || sortedReportResults[i + 1].name !== currentName) {
        aggregatedResults.push(
          createAggregatedResult(aggregatedIndex, groupedResults, totalFailed, totalPassed,
            currentName, result.fixtureName));
        currentName = undefined;
        testIndex = 0;
        totalFailed = 0;
        totalPassed = 0;
        groupedResults = [];
        aggregatedIndex++;
      } else {
        testIndex++;
      }
    }
  }

  return aggregatedResults;
}

function createAggregatedResult(index: number, groupedResults: ReportResult[],
                                totalFailed: number, totalPassed: number, testName: string, fixtureName: string) {
  const aggregatedStatus = totalFailed === 0 ? 'passed' : 'failed';
  const aggregatedResult: AggregatedReportResult = {
    index: index,
    reportResults: groupedResults,
    testStatus: aggregatedStatus,
    testName: testName,
    fixtureName: fixtureName,
    totalFailed: totalFailed,
    totalPassed: totalPassed
  };
  return aggregatedResult;
}

function sortReportItemsByTestName(reportResults: ReportResult[]): ReportResult[] {
  return reportResults.sort((a, b) => {
    const nameA = a.name.toUpperCase(); // ignore upper and lowercase
    const nameB = b.name.toUpperCase(); // ignore upper and lowercase
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    // names must be equal
    return 0;
  });
}
