[![NPM](https://nodei.co/npm/visual-check-testcafe.png)](https://nodei.co/npm/visual-check-testcafe/)

# visual-check-testcafe

Testcafe plugin for testing visual regression backed by resemblejs image compare

## Features

- Fully integrated in test run
- Concurrency support
- Multi-browser support
- Reporting including multi-browser

## Installation

```bash
npm install visual-check-testcafe --save-dev
```

## How to use

You can write a TestCafe test with automated visual testing like this.

```js
import { visualCheck } from 'visual-check-testcafe';

fixture `TestCafe tests with Visual compare`
    .page `http://example.com`;

test('Automated visual testing', async t => {
  await visualCheck(t, options);
});

```

### Reporting


<p align="center">
  <img width="600" height="400" src="report.png">
</p>

Report will be located at .reports/visual-check-testcafe/report.html

### Options
```
visualCheck(t, options?)
```

- `options.label` &mdash; Custom name for the taken snapshot
- `options.timeout` &mdash; Waiting time before taking snapshots
- `options.selector` &mdash; String, or `Selector()` to match on the DOM
- `options.maxDiffPercentage`&mdash; Default is 0.1 

### Setup 
Each time you run tests with --setup-baseline it'll take the base screenshots.
It will report during test in the following way:

```bash
visual-check-testcafe: Baseline {path} created
```

During a test run it can occur a baseline is not there. If you haven't provided 
 the --setup-baseline your test will fail with the following message:

```bash
AssertionError: visual-check-testcafe: no baseline present, storing baseline for next run: expected 'no baseline' to be falsy
      
      + expected - actual
      
      -'no baseline'
      +undefined
```

## RoadMap

- Add configurable output folder
- Add custom typings for testcontroller testRun
- Add automated tests
