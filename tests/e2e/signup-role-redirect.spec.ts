import { test, expect, type Page } from "@playwright/test";

const LOCALE = "zh-HK";

async function fillSignUpForm(
  page: Page,
  opts: {
    email: string;
    password: string;
    role: "student" | "tutor";
    fullName: string;
    phone?: string;
  },
) {
  const signUpForm = page.locator("form").filter({
    has: page.locator("button").filter({ hasText: /^註冊$|Sign up/i }),
  }).first();

  await signUpForm.locator(`input[name="role"][value="${opts.role}"]`).check();
  await signUpForm.locator('input[name="email"]').fill(opts.email);
  await signUpForm.locator('input[name="full_name"]').fill(opts.fullName);
  await signUpForm.locator('input[name="phone"]').fill(opts.phone ?? "66668888");
  await signUpForm.locator('input[name="password"]').fill(opts.password);
  await signUpForm.locator('input[name="accept_terms"]').check();
  await signUpForm.locator("button").filter({ hasText: /^註冊$|Sign up/i }).click();
}

test.describe("sign-up role → dashboard", () => {
  const emailPrefix = process.env.E2E_SIGNUP_EMAIL_PREFIX;
  const password = process.env.E2E_SIGNUP_PASSWORD;

  test.beforeEach(() => {
    test.skip(!emailPrefix || !password, "Set E2E_SIGNUP_EMAIL_PREFIX and E2E_SIGNUP_PASSWORD");
  });

  test("student registration lands on student dashboard (我的家教中心)", async ({ page }) => {
    const email = `${emailPrefix}+student-${Date.now()}@example.com`;
    await page.goto(`/${LOCALE}/auth`);
    await fillSignUpForm(page, {
      email,
      password: password!,
      role: "student",
      fullName: `E2E Student ${Date.now()}`,
    });

    await expect(page).toHaveURL(new RegExp(`/${LOCALE}/dashboard/student`));
    await expect(page.getByRole("heading", { name: "我的家教中心" })).toBeVisible();
    await expect(page.getByText("開始預約導師")).toBeVisible();
  });

  test("tutor registration lands on tutor dashboard (導師中心)", async ({ page }) => {
    const email = `${emailPrefix}+tutor-${Date.now()}@example.com`;
    await page.goto(`/${LOCALE}/auth`);
    await fillSignUpForm(page, {
      email,
      password: password!,
      role: "tutor",
      fullName: `E2E Tutor ${Date.now()}`,
    });

    await expect(page).toHaveURL(new RegExp(`/${LOCALE}/dashboard/tutor`));
    await expect(page.getByRole("heading", { name: "導師中心" })).toBeVisible();
    await expect(page.getByText("完成導師資料設置")).toBeVisible();
  });
});
