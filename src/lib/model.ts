export interface Config {
  maxDiffPercentage: number
}
//TODO: Discussed with Marloes that aggregation of ReportResult based on test should occur. This should be implemented in template!
export interface AggregatedReportTestResult {
  testName: string,
  reportResults: ReportResult[]
}

export interface ReportResult {
  index?: number,
  result: 'passed' | 'failed',
  name: string,
  browser: string,
  os: string,
  details: [{
    actualImgPath: string,
    baseImgPath: string,
    diffImgPath: string
  }]
}

export interface Report {
  results: ReportResult[],
  total: number
}
