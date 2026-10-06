import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { buildHeatmap } from "../../lib/leetcode-calendar";

const data = JSON.parse(readFileSync(path.join(process.cwd(), "data/leetcode.json"), "utf8"));
const hm = buildHeatmap(data.calendar, String(data.fetchedAt).slice(0, 10));

// a day with real submissions, so the tooltip text is predictable
let busy = { w: 0, d: 0, count: 0 };
hm.weeks.forEach((col, w) =>
  col.forEach((c, d) => {
    if (c && c.count > busy.count) busy = { w, d, count: c.count };
  }),
);

test.describe("LeetCode heatmap", () => {
  test("shows the real submission total and 365 days", async ({ page }) => {
    await page.goto("/");
    const card = page.locator(".hm-card");
    await card.scrollIntoViewIfNeeded();
    await expect(card.locator(".hm-title b")).toHaveText(String(hm.total));
    await expect(page.locator(".hm svg rect.c")).toHaveCount(365);
    await expect(card.locator(".hm-stats")).toContainText(`${hm.activeDays} active days`);
  });

  test("never labels the longest streak as the current one", async ({ page }) => {
    await page.goto("/");
    const stats = page.locator(".hm-stats");
    await stats.scrollIntoViewIfNeeded();
    await expect(stats).toContainText(`longest streak ${hm.longestStreak} days`);
    await expect(page.locator("body")).not.toContainText("26-day streak");
  });

  test("hovering a day shows a lock-on bracket and its date and count", async ({ page }) => {
    await page.goto("/");
    const cell = page.locator(`.hm rect[data-w="${busy.w}"][data-d="${busy.d}"]`);
    await cell.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200); // let the pop-in animation finish
    await cell.hover();
    const tip = page.locator(".hm-tip");
    await expect(tip).toBeVisible();
    await expect(tip).toContainText(`${busy.count} submission`);
    await expect(page.locator(".hmbox")).toHaveCount(1);
    await page.mouse.move(5, 5);
    await expect(tip).toHaveCount(0);
  });

  test("keyboard arrows walk the days and Escape closes", async ({ page }) => {
    await page.goto("/");
    const plot = page.locator(".hm-plot");
    await plot.scrollIntoViewIfNeeded();
    await plot.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator(".hm-tip")).toBeVisible();
    const first = await page.locator(".hm-plot + p, .hm > p[aria-live]").first().textContent();
    expect(first).toMatch(/submission/i);
    await page.keyboard.press("ArrowLeft");
    const second = await page.locator(".hm > p[aria-live]").textContent();
    expect(second).not.toBe(first);
    await page.keyboard.press("Escape");
    await expect(page.locator(".hm-tip")).toHaveCount(0);
  });

  test("describes itself to screen readers", async ({ page }) => {
    await page.goto("/");
    const label = await page.locator(".hm-plot").getAttribute("aria-label");
    expect(label).toContain(`${hm.total} submissions`);
    expect(label).toContain("arrow keys");
  });
});

test.describe("LeetCode heatmap on a phone", () => {
  test.use({ viewport: { width: 375, height: 800 }, hasTouch: true });

  test("scrolls sideways inside its own box without widening the page", async ({ page }) => {
    await page.goto("/");
    const scroller = page.locator(".hm-scroll");
    await scroller.scrollIntoViewIfNeeded();
    const m = await scroller.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, sl: el.scrollLeft }));
    expect(m.sw).toBeGreaterThan(m.cw);
    expect(m.sl).toBeGreaterThan(0); // starts on the most recent weeks
    const pageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(pageOverflow).toBe(false);
  });

  test("tapping a day keeps its tooltip open", async ({ page }) => {
    await page.goto("/");
    const cell = page.locator(`.hm rect[data-w="${busy.w}"][data-d="${busy.d}"]`);
    await cell.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await cell.tap();
    await expect(page.locator(".hm-tip")).toContainText(`${busy.count} submission`);
  });
});
