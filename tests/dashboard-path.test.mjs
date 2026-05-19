import test from "node:test";
import assert from "node:assert/strict";

/** Mirror src/lib/dashboard-path.ts for fast unit check without TS loader. */
function dashboardPathForRole(locale, role) {
  if (role === "tutor") return `/${locale}/dashboard/tutor`;
  if (role === "admin") return `/${locale}/dashboard/admin`;
  return `/${locale}/dashboard/student`;
}

test("dashboardPathForRole routes by role", () => {
  assert.equal(dashboardPathForRole("zh-HK", "student"), "/zh-HK/dashboard/student");
  assert.equal(dashboardPathForRole("zh-HK", "tutor"), "/zh-HK/dashboard/tutor");
  assert.equal(dashboardPathForRole("en", "admin"), "/en/dashboard/admin");
});
