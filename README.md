# visual-check-testcafe

Testcafe plugin for testing visual regression backed by resemblejs image compare

## Installation

```bash
npm install visual-compare-testcafe --save-dev
```

## How to use

You can write a TestCafe test with automated accessibility checks like this.

```js
import { visualCheck } from 'visual-compare-testcafe';
import { Selector } from 'testcafe';

fixture `TestCafe tests with Visual compare`
    .page `http://example.com`;

test('Automated visual testing', async t => {
  // invoke with selector to validate part of a page
  await visualCheck(t, 'loginForm', Selector('form'));
  // invoke without selector to validate whole page
  await visualCheck(t, 'loginPage');
});
```
