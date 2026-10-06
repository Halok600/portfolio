import { expect, test, type Page } from "@playwright/test";

const ANSWER = {
  language_detected: "python",
  time: { class: "O(log n)", expression: "O(log n)", confidence: 0.9, engine: "symbolic", certainty: "certain", abstain: false },
  space: { class: "O(1)", expression: "O(1)", confidence: 0.95, engine: "symbolic", certainty: "certain", abstain: false },
  engine: "symbolic",
  derivation: [{ line: 3, kind: "loop", text: "loop runs O(log n) times; the whole loop costs O(log n)" }],
  curve: {
    n: [8, 64, 512],
    time: { predicted_class: "O(log n)", series: { "O(log n)": [3, 6, 9], "O(n)": [8, 64, 512] } },
    space: { predicted_class: "O(1)", series: { "O(1)": [1, 1, 1] } },
  },
};

async function mockApi(page: Page, handler: (body: { code: string; language: string }) => Promise<{ status: number; body: unknown }>) {
  const seen: { code: string; language: string }[] = [];
  await page.route("**/api/polyo", async (route) => {
    const req = route.request();
    if (req.method() !== "POST") return route.fulfill({ status: 204 });
    const body = req.postDataJSON();
    seen.push(body);
    const r = await handler(body);
    return route.fulfill({ status: r.status, contentType: "application/json", body: JSON.stringify(r.body) });
  });
  return seen;
}

const box = (page: Page) => page.locator("#tryPolyo");

test.describe("Try PolyO", () => {
  test("shows a labelled sample result before anything is run", async ({ page }) => {
    await page.goto("/");
    await box(page).scrollIntoViewIfNeeded();
    await expect(page.locator(".pr-tag")).toContainText("Sample result");
    await expect(page.locator(".pr-big")).toContainText("O(n²)");
    await expect(page.locator(".pr-big")).toContainText("O(1)");
    await expect(page.locator(".pr-steps li").first()).toContainText("loop runs");
    await expect(page.locator(".pr-chart svg")).toBeVisible();
  });

  test("wakes the server when the section comes into view", async ({ page }) => {
    let warmups = 0;
    await page.route("**/api/polyo", (route) => {
      if (route.request().method() === "GET") warmups++;
      return route.fulfill({ status: 204 });
    });
    await page.goto("/");
    await box(page).scrollIntoViewIfNeeded();
    await expect.poll(() => warmups).toBe(1);
  });

  test("analyses an example and replaces the sample", async ({ page }) => {
    const seen = await mockApi(page, async () => ({ status: 200, body: ANSWER }));
    await page.goto("/");
    await box(page).scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Binary search" }).click();
    await expect(page.locator(".pr-big")).toContainText("O(log n)");
    await expect(page.locator(".pr-tag")).toContainText("static analysis");
    await expect(page.locator(".pr-tag")).not.toContainText("Sample");
    await expect(page.locator(".pr-res .box")).toHaveCount(1);
    expect(seen).toHaveLength(1);
    expect(seen[0].language).toBe("python");
    expect(seen[0].code).toContain("mid");
  });

  test("Ctrl+Enter runs the code in the editor", async ({ page }) => {
    const seen = await mockApi(page, async () => ({ status: 200, body: ANSWER }));
    await page.goto("/");
    const editor = page.getByLabel("Source code to analyse");
    await editor.scrollIntoViewIfNeeded();
    await editor.fill("def f(a):\n    return a[0]\n");
    await editor.press("Control+Enter");
    await expect(page.locator(".pr-big")).toContainText("O(log n)");
    expect(seen[0].code).toContain("return a[0]");
  });

  test("tells the visitor the server is waking up when it is slow", async ({ page }) => {
    await mockApi(page, async () => {
      await new Promise((r) => setTimeout(r, 5800));
      return { status: 200, body: ANSWER };
    });
    await page.goto("/");
    await box(page).scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Analyse" }).click();
    await expect(page.locator(".pr-wait")).toContainText("Waking up PolyO", { timeout: 8000 });
    await expect(page.locator(".pr-big")).toContainText("O(log n)", { timeout: 8000 });
    await expect(page.locator(".pr-wait")).toHaveCount(0);
  });

  test("shows a clear error with a way out", async ({ page }) => {
    await mockApi(page, async () => ({ status: 502, body: { error: "Could not reach PolyO right now." } }));
    await page.goto("/");
    await box(page).scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Analyse" }).click();
    await expect(page.locator(".pr-err")).toContainText("Could not reach PolyO right now.");
    await expect(page.getByRole("link", { name: /Open the full PolyO app/ })).toHaveAttribute("href", "https://polyo.vercel.app");
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  test("cannot analyse an empty editor and caps the length", async ({ page }) => {
    await page.goto("/");
    const editor = page.getByLabel("Source code to analyse");
    await editor.scrollIntoViewIfNeeded();
    await editor.fill("");
    await expect(page.getByRole("button", { name: "Analyse" })).toBeDisabled();
    await editor.fill("x".repeat(6000));
    await expect(page.locator(".pr-foot")).toContainText("5,000 / 5,000");
  });

  test("the real proxy refuses other websites and bad input", async ({ request }) => {
    const cross = await request.post("/api/polyo", {
      headers: { origin: "https://evil.example" },
      data: { code: "x", language: "python" },
    });
    expect(cross.status()).toBe(403);
    const bad = await request.post("/api/polyo", { data: { code: "x", language: "cobol" } });
    expect(bad.status()).toBe(400);
  });
});

test.describe("Recently shipped", () => {
  test("is either hidden or made of real, non-housekeeping GitHub commits", async ({ page }) => {
    await page.goto("/");
    const rows = page.locator("#shipped a.sp");
    const n = await rows.count();
    test.skip(n === 0, "GitHub was unreachable at build time, so the strip is correctly hidden");
    for (let i = 0; i < n; i++) {
      await expect(rows.nth(i)).toHaveAttribute("href", /^https:\/\/github\.com\/Halok600\/[^/]+\/commit\/[0-9a-f]{7,40}$/);
      await expect(rows.nth(i)).not.toContainText(/^chore|^docs:|^ci:/i);
    }
  });
});
