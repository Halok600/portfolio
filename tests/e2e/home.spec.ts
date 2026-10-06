import { expect, test } from "@playwright/test";

test("renders the résumé content and logs no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Priyanshu Tiwari" })).toBeVisible();
  for (const name of [
    "PolyO", "The Aerial Guardian", "Enagram.io", "WeaponShield AI",
    "India Space Lab", "Jaypee Institute of Information Technology",
  ]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await expect(page.getByText("Embedded Systems Intern")).toBeVisible();
  await expect(page.getByText("603", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("hidden projects do not appear", async ({ page }) => {
  await page.goto("/");
  for (const name of ["MedFusionAI", "Leehint", "reddit-insights", "drone-tilt-detection"]) {
    await expect(page.getByRole("heading", { name })).toHaveCount(0);
  }
});

test("shows no phone number and no ISRO claim", async ({ page }) => {
  await page.goto("/");
  const body = page.locator("body");
  await expect(body).not.toContainText("XXXXXXXXXX");
  await expect(body).not.toContainText("+91");
  await expect(body).not.toContainText("ISRO");
});

test("contest rating is hidden by default", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("1533")).toHaveCount(0);
});

test("theme toggle switches and persists across reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");
});

test("first visit follows the system colour scheme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("résumé link serves a PDF", async ({ page, request }) => {
  await page.goto("/");
  const link = page.getByRole("link", { name: "Résumé" });
  await expect(link).toHaveAttribute("href", "/resume.pdf");
  const res = await request.get("/resume.pdf");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("pdf");
});

test("external links open safely", async ({ page }) => {
  await page.goto("/");
  const links = page.locator('a[target="_blank"]');
  expect(await links.count()).toBeGreaterThan(5);
  for (const rel of await links.evaluateAll((els) => els.map((e) => e.getAttribute("rel")))) {
    expect(rel).toContain("noopener");
  }
});

for (const width of [375, 768, 1440]) {
  test(`no horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
}

test("unknown routes show the 404 page", async ({ page }) => {
  const res = await page.goto("/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("That page doesn't exist.")).toBeVisible();
});
