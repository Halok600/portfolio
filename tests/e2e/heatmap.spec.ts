import { expect, test, type Page } from "@playwright/test";

// The graph is read from github.com on the server, so a test cannot mock it. The site hides the
// graph when GitHub is unreachable (by design), so these tests skip then instead of failing.
async function openGraph(page: Page) {
  await page.goto("/");
  const card = page.locator(".hm-card");
  test.skip((await card.count()) === 0, "GitHub graph unavailable (upstream down); the site hides it by design");
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200); // let the pop-in animation finish
  return card;
}

// a day with contributions, so the tooltip text is predictable
const busy = (page: Page) => page.locator(".hm rect.c:not(.l0)").first();

test.describe("GitHub contribution graph", () => {
  test("shows the contribution total and 365 days", async ({ page }) => {
    const card = await openGraph(page);
    const total = Number(await card.locator(".hm-title b").textContent());
    expect(total).toBeGreaterThan(0);
    await expect(page.locator(".hm svg rect.c")).toHaveCount(365);
    await expect(card.locator(".hm-stats")).toContainText("active days");
    await expect(page.locator("#shipped")).toContainText("live from GitHub");
  });

  test("never labels the longest streak as the current one", async ({ page }) => {
    const card = await openGraph(page);
    const stats = (await card.locator(".hm-stats").textContent()) ?? "";
    expect(stats).toMatch(/longest streak \d+ days/);
    // "current streak" only appears when it is a real, separate number
    for (const m of stats.matchAll(/current streak (\d+) days/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(7);
  });

  test("hovering a day shows a lock-on bracket and its date and count", async ({ page }) => {
    await openGraph(page);
    await busy(page).hover();
    const tip = page.locator(".hm-tip");
    await expect(tip).toBeVisible();
    await expect(tip).toContainText(/\d+ contributions? · /);
    await expect(page.locator(".hmbox")).toHaveCount(1);
    await page.mouse.move(5, 5);
    await expect(tip).toHaveCount(0);
  });

  test("keyboard arrows walk the days and Escape closes", async ({ page }) => {
    await openGraph(page);
    const plot = page.locator(".hm-plot");
    await plot.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator(".hm-tip")).toBeVisible();
    const live = page.locator(".hm > p[aria-live]");
    const first = await live.textContent();
    expect(first).toMatch(/contribution/i);
    await page.keyboard.press("ArrowLeft");
    await expect(live).not.toHaveText(first ?? "");
    await page.keyboard.press("Escape");
    await expect(page.locator(".hm-tip")).toHaveCount(0);
  });

  test("describes itself to screen readers", async ({ page }) => {
    await openGraph(page);
    const label = await page.locator(".hm-plot").getAttribute("aria-label");
    expect(label).toMatch(/\d+ GitHub contributions in the past year/);
    expect(label).toContain("arrow keys");
  });
});

test.describe("GitHub contribution graph on a phone", () => {
  test.use({ viewport: { width: 375, height: 800 }, hasTouch: true });

  test("scrolls sideways inside its own box without widening the page", async ({ page }) => {
    await openGraph(page);
    const m = await page.locator(".hm-scroll").evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, sl: el.scrollLeft }));
    expect(m.sw).toBeGreaterThan(m.cw);
    expect(m.sl).toBeGreaterThan(0); // starts on the most recent weeks
    const pageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(pageOverflow).toBe(false);
  });

  test("tapping a day keeps its tooltip open", async ({ page }) => {
    await openGraph(page);
    await busy(page).tap();
    await expect(page.locator(".hm-tip")).toContainText(/contribution/);
  });
});

test.describe("LeetCode section", () => {
  test("shows live numbers and a text stats line, with no graph of its own", async ({ page }) => {
    await page.goto("/");
    const dsa = page.locator("#dsa");
    await dsa.scrollIntoViewIfNeeded();
    await expect(dsa.locator(".dsa-stats")).toContainText(/\d+ submissions in the past year/);
    await expect(dsa.locator(".dsa-stats")).toContainText("longest streak");
    await expect(dsa.locator(".hm")).toHaveCount(0);
  });
});
