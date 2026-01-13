const { test, expect } = require('@playwright/test');

function unique(name) {
  return `${name}_${Date.now().toString(36).slice(-6)}`;
}

test('register, login, and data isolation between users', async ({ page }) => {
  await page.goto('/');

  // Should show auth modal when not logged in
  await expect(page.locator('#authModal')).toBeVisible();

  const userA = unique('userA');
  const passA = 'Password123!';

  // Register user A
  await page.fill('#authUsernameInput', userA);
  await page.fill('#authPasswordInput', passA);
  await page.click('#authRegisterBtn');

  // After register, should show user info and not show auth modal
  await expect(page.locator('#authModal')).toBeHidden();
  await expect(page.locator('#userInfo')).toBeVisible();
  await expect(page.locator('#currentUserName')).toHaveText(userA);

  // Add a new row and fill title, then save
  await page.click('#addNewRowBtn');
  await expect(page.locator('tr.row-editing')).toBeVisible();

  // Fill title textarea in row editing
  const titleArea = page.locator('tr.row-editing td[data-colkey="title"] textarea');
  await expect(titleArea).toBeVisible();
  await titleArea.fill('Paper by A');

  // Save the row
  await page.click('tr.row-editing button.save-btn');

  // Confirm title appears in the table
  await expect(page.locator('td[data-colkey="title"]')).toContainText('Paper by A');

  // Logout
  await page.click('#logoutBtn');
  await page.waitForLoadState('load');

  // Register user B
  await expect(page.locator('#authModal')).toBeVisible();
  const userB = unique('userB');
  const passB = 'Password456!';
  await page.fill('#authUsernameInput', userB);
  await page.fill('#authPasswordInput', passB);
  await page.click('#authRegisterBtn');

  // User B should not see user A's row
  await expect(page.locator('#emptyState')).toBeVisible();

  // Logout user B
  await page.click('#logoutBtn');
  await page.waitForLoadState('load');

  // Login as user A again
  await expect(page.locator('#authModal')).toBeVisible();
  await page.fill('#authUsernameInput', userA);
  await page.fill('#authPasswordInput', passA);
  await page.click('#authLoginBtn');

  // User A should see their row
  await expect(page.locator('td[data-colkey="title"]')).toContainText('Paper by A');
});