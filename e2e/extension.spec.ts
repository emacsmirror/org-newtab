import { test, expect } from './fixture';

const MASTER_MESSAGE = 'Closed - Master';
const CLIENT_MESSAGE = 'Uninstantiated - Client';
const STATUS_LOCATOR = 'connection-status';

test('newtab page', async ({ page, extensionId }) => {
	await page.goto(`chrome-extension://${extensionId}/newtab.html`);
	await expect(page.getByTestId(STATUS_LOCATOR)).toHaveText(MASTER_MESSAGE);
});

test('multiple tabs', async ({ extensionId, context }) => {
	const tab1 = await context.newPage();
	const tab2 = await context.newPage();
	await tab1.goto(`chrome-extension://${extensionId}/newtab.html`);
	await tab2.goto(`chrome-extension://${extensionId}/newtab.html`);
	await expect(tab1.getByTestId(STATUS_LOCATOR)).toHaveText(MASTER_MESSAGE);
	await expect(tab2.getByTestId(STATUS_LOCATOR)).toHaveText(CLIENT_MESSAGE);
});

test('tab query flow', async ({ extensionId, context }) => {
	const tab1 = await context.newPage();
	const tab2 = await context.newPage();
	const tab3 = await context.newPage();
	await tab1.goto(`chrome-extension://${extensionId}/newtab.html`);
	await tab2.goto(`chrome-extension://${extensionId}/newtab.html`);
	await tab3.goto(`chrome-extension://${extensionId}/newtab.html`);
	await expect(tab1.getByTestId(STATUS_LOCATOR)).toHaveText(MASTER_MESSAGE);
	await expect(tab2.getByTestId(STATUS_LOCATOR)).toHaveText(CLIENT_MESSAGE);
	await expect(tab3.getByTestId(STATUS_LOCATOR)).toHaveText(CLIENT_MESSAGE);
	await tab1.close();
	await expect(tab2.getByTestId(STATUS_LOCATOR)).toHaveText(MASTER_MESSAGE);
	await expect(tab3.getByTestId(STATUS_LOCATOR)).toHaveText(CLIENT_MESSAGE);
	const tab4 = await context.newPage();
	await tab4.goto(`chrome-extension://${extensionId}/newtab.html`);
	await expect(tab4.getByTestId(STATUS_LOCATOR)).toHaveText(CLIENT_MESSAGE);
	await tab2.reload();
	await expect(tab3.getByTestId(STATUS_LOCATOR)).toHaveText(MASTER_MESSAGE);
	await expect(tab2.getByTestId(STATUS_LOCATOR)).toHaveText(CLIENT_MESSAGE);
	await expect(tab4.getByTestId(STATUS_LOCATOR)).toHaveText(CLIENT_MESSAGE);
	await tab2.close();
	await expect(tab3.getByTestId(STATUS_LOCATOR)).toHaveText(MASTER_MESSAGE);
	await expect(tab4.getByTestId(STATUS_LOCATOR)).toHaveText(CLIENT_MESSAGE);
	await tab3.close();
	await expect(tab4.getByTestId(STATUS_LOCATOR)).toHaveText(MASTER_MESSAGE);
	await tab4.reload();
	await expect(tab4.getByTestId(STATUS_LOCATOR)).toHaveText(MASTER_MESSAGE);
});
