import { test, expect } from "@playwright/test";

test.describe("Store Settings - Business Fields", () => {
  test("should redirect after login and validate store fields", async ({ page }) => {
    // Step 1: Login
    await page.goto("http://localhost:3000/sign-in");

    // Fill login form (adjust selectors as per your DOM)
    await page.fill('input[name="email"]', "Naveen311@example.com");
    await page.fill('input[name="password"]', "Bhanu@311r");
    await page.click('button[type="submit"]');

    // Step 2: Check redirect to role-menu
    await expect(page).toHaveURL(/.*\/role-menu/);

    // Step 3: Click on Store Settings card
    await page.click('text=Store Settings'); // adjust selector if it's a button/card

    // Step 4: Check we landed in /store-settings
    await expect(page).toHaveURL(/.*\/store-settings/);

    // Step 5: Validate Store tab fields
    const businessName = page.locator('input[placeholder="Business Name"], input[name="businessName"]');
    const businessNumber = page.locator('input[placeholder="Business Number"], input[name="businessNumber"]');

    await expect(businessName).toHaveValue(/.+/);   // must not be empty
    await expect(businessNumber).toHaveValue(/.+/); // must not be empty
  });
});
