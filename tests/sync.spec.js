const { test, expect } = require('@playwright/test');

// This test mocks the /api endpoints to verify the UI flows for push/pull

test('sync push and pull flows (mocked)', async ({ page }) => {
  await page.goto('/');

  // mock push endpoint
  await page.route('**/api/push', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok:true, commit: 'mocksha' }) });
  });
  // mock pull endpoint (returning a payload)
  await page.route('**/api/pull*', route => {
    const resp = { ok:true, file: { meta:{username:'mock', updatedAt: new Date().toISOString()}, data: { data: [{ id:'a1', title:'Remote Paper' }], customColumns:[], customHeaders:[], hiddenColKeys:[] } } };
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(resp) });
  });

  // register a user
  await page.fill('#authUsernameInput', 'sync_user');
  await page.fill('#authPasswordInput', 'pass123');
  await page.click('#authRegisterBtn');
  await expect(page.locator('#userInfo')).toBeVisible();

  // open sync modal
  await page.click('#syncBtn');
  await expect(page.locator('#syncModal')).toBeVisible();

  // push should succeed (mock)
  await page.click('#pushBtn');
  await expect(page.locator('#syncStatus')).toContainText('已推送');

  // pull should merge remote data
  await page.click('#pullBtn');
  await expect(page.locator('#syncStatus')).toContainText('已拉取');
  await expect(page.locator('td[data-colkey="title"]')).toContainText('Remote Paper');

  // test secret input: set a value and ensure it doesn't break calls
  await page.fill('#syncSecretInput', 'mysecret');
  await page.click('#pullBtn');
  await expect(page.locator('#syncStatus')).toContainText('已拉取');
});