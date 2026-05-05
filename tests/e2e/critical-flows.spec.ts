import { test, expect, type Page } from "@playwright/test";

const LOCALE = "zh-HK";

async function signInAsStudent(page: Page, email: string, password: string) {
  await page.goto(`/${LOCALE}/auth`);
  const signInForm = page.locator("form").filter({
    has: page.locator("button").filter({ hasText: /登入|Sign in/i }),
  }).first();
  await signInForm.locator('input[name="email"]').fill(email);
  await signInForm.locator('input[name="password"]').fill(password);
  await signInForm.locator("button").filter({ hasText: /登入|Sign in/i }).click();
  await expect(page).toHaveURL(new RegExp(`/${LOCALE}/dashboard`));
}

test("smoke: registration redirects to dashboard", async ({ page }) => {
  const emailPrefix = process.env.E2E_SIGNUP_EMAIL_PREFIX;
  const password = process.env.E2E_SIGNUP_PASSWORD;
  test.skip(!emailPrefix || !password, "Missing E2E_SIGNUP_EMAIL_PREFIX / E2E_SIGNUP_PASSWORD");

  const email = `${emailPrefix}+${Date.now()}@example.com`;
  await page.goto(`/${LOCALE}/auth`);
  const signUpForm = page.locator("form").filter({
    has: page.locator("button").filter({ hasText: /註冊|Sign up/i }),
  }).first();

  await signUpForm.locator('input[name="email"]').fill(email);
  await signUpForm.locator('input[name="full_name"]').fill(`E2E User ${Date.now()}`);
  await signUpForm.locator('input[name="phone"]').fill("66668888");
  await signUpForm.locator('input[name="password"]').fill(password);
  await signUpForm.locator("button").filter({ hasText: /註冊|Sign up/i }).click();

  await expect(page).toHaveURL(new RegExp(`/${LOCALE}/dashboard`));
});

test("smoke: booking flow can reach message thread", async ({ page }) => {
  const studentEmail = process.env.E2E_STUDENT_EMAIL;
  const studentPassword = process.env.E2E_STUDENT_PASSWORD;
  const tutorId = process.env.E2E_TUTOR_ID;
  test.skip(!studentEmail || !studentPassword || !tutorId, "Missing E2E_STUDENT_EMAIL / E2E_STUDENT_PASSWORD / E2E_TUTOR_ID");

  await signInAsStudent(page, studentEmail!, studentPassword!);
  await page.goto(`/${LOCALE}/booking/new?tutorId=${tutorId}`);
  await expect(page).toHaveURL(new RegExp(`/${LOCALE}/booking/new`));

  const noSlotsHint = page.getByText(/該日沒有可預約時段|No available slots/i);
  if (await noSlotsHint.isVisible()) {
    test.skip(true, "No available slot for configured tutor/date in this environment");
  }

  const bookingForm = page.locator("form").filter({
    has: page.locator(`input[name="tutor_id"][value="${tutorId}"]`),
  }).first();
  await expect(bookingForm).toBeVisible();
  await bookingForm.locator("button[type='submit']").click();

  await expect(page).toHaveURL(new RegExp(`/${LOCALE}/messages/`));
});

test("smoke: support entry goes to support message thread", async ({ page }) => {
  const studentEmail = process.env.E2E_STUDENT_EMAIL;
  const studentPassword = process.env.E2E_STUDENT_PASSWORD;
  test.skip(!studentEmail || !studentPassword, "Missing E2E_STUDENT_EMAIL / E2E_STUDENT_PASSWORD");

  await signInAsStudent(page, studentEmail!, studentPassword!);
  await page.goto(`/${LOCALE}/support`);
  await expect(page).toHaveURL(new RegExp(`/${LOCALE}/messages(?:/|\\?)`));
});
