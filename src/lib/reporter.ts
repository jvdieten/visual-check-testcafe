import { createWriteStream } from 'fs';
import { createCanvas, loadImage } from 'canvas';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as lineReader from 'linereader'
import { Report, ReportResult } from './model';


export abstract class Reporter {

  async createReportImage(baselineScreenshotPath: string, testScreenshotPath: string, diffScreenshotPath: string): Promise<void> {
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

  createHTMLReport(reportPath: string) {
    const reportResults: ReportResult[] = [];
    let indexCounter = 0;
    lineReader.open(reportPath + 'results.json', function(reader) {
      if (reader.hasNextLine()) {
        reader.nextLine(function(line) {
          const testResult: ReportResult = JSON.parse(line);
          testResult.index = indexCounter;
          reportResults.push(testResult);
          indexCounter++;
        });
      }
    });

    let data: Report = {
      total: reportResults.length,
      results: reportResults
    };
    const template = fs.readFileSync(__dirname + '/html-report-template.html', 'utf8');
    const compiledTemplate = handlebars.compile(template, {});
    const html = compiledTemplate(data);
    fs.writeFile(reportPath + 'report.html', html, 'utf8', () => {
    });
  }
}
// export async function createReportImage(baselineScreenshotPath: string, testScreenshotPath: string, diffScreenshotPath: string): Promise<void> {
//   const baselineImage = await loadImage(baselineScreenshotPath);
//   const testImage = await loadImage(testScreenshotPath);
//   const diffImage = await loadImage(diffScreenshotPath);
//
//   const { width, height } = baselineImage;
//
//   const canvas = createCanvas(width * 3, height);
//   const ctx = canvas.getContext('2d');
//
//   ctx.drawImage(baselineImage, 0, 0, width, height);
//   ctx.drawImage(testImage, width, 0, width, height);
//   ctx.drawImage(diffImage, 2 * width, 0, width, height);
//
//   // add header
//   ctx.font = '16px Arial';
//   ctx.fillText('Baseline', 0, 12);
//   ctx.fillText('Actual', width, 12);
//   ctx.fillText('Diff', width * 2, 12);
//
//   const out = createWriteStream(testScreenshotPath);
//   const stream = canvas.createPNGStream();
//
//   stream.pipe(out);
// }
//
//
// export async function
// }
