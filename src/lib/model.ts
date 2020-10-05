// @ts-ignore
import { Selector } from "testcafe";

export interface Config {
  label?: string
  maxDiffPercentage?: number,
  selector?: Selector,
  timeOut?: number
}

export interface AggregatedReportResult {
  index: number,
  fixtureName: string,
  testName: string,
  totalPassed: number,
  totalFailed: number,
  testStatus: 'passed' | 'failed',
  reportResults: ReportResult[]
}

export interface ReportResult {
  index?: number,
  status: 'passed' | 'failed',
  name: string,
  fixtureName: string,
  misMatchPercentage?: number,
  browser: string,
  os: string,
  details: [{
    actualImgPath: string,
    baseImgPath: string,
    diffImgPath: string
  }]
}

export interface Report {
  results: AggregatedReportResult[],
  total: number
}


export const resembleOptions = {
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
