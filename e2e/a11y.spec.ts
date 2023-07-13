import { test } from './fixture';
import { checkA11y, injectAxe } from 'axe-playwright';

test('check accessibility', async ({ page, extensionId }) => {
	await page.goto(`chrome-extension://${extensionId}/newtab.html`);
	await injectAxe(page);
	await checkA11y(page);
});
