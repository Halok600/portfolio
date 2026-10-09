import { describe, expect, it } from "vitest";
import { buildHeatmap, levelFor } from "@/lib/calendar";

const END = "2026-10-07"; // a Wednesday; the window then starts Wed 2025-10-08

describe("levelFor", () => {
  it("buckets submission counts into five levels", () => {
    expect([0, 1, 2, 3, 4, 7, 8, 20].map(levelFor)).toEqual([0, 1, 2, 2, 3, 3, 4, 4]);
  });
});

describe("buildHeatmap grid", () => {
  const h = buildHeatmap({}, END);

  it("is always 53 weeks of 7 rows", () => {
    expect(h.weeks).toHaveLength(53);
    expect(h.weeks.every((w) => w.length === 7)).toBe(true);
  });

  it("starts weeks on Monday and leaves cells before the window empty", () => {
    // 2025-10-08 is a Wednesday, so Monday and Tuesday of week 0 are outside the window
    expect(h.weeks[0][0]).toBeNull();
    expect(h.weeks[0][1]).toBeNull();
    expect(h.weeks[0][2]?.date).toBe("2025-10-08");
  });

  it("ends on the end date and leaves later cells empty", () => {
    const last = h.weeks[52];
    expect(last[2]?.date).toBe("2026-10-07");
    expect(last[3]).toBeNull();
  });
});

describe("buildHeatmap numbers", () => {
  const calendar = {
    "2025-10-07": 9, // one day before the window: must be ignored
    "2025-11-03": 5,
    "2025-11-04": 2,
    "2026-10-05": 1,
    "2026-10-06": 3,
    "2026-10-07": 1,
  };
  const h = buildHeatmap(calendar, END);

  it("counts only days inside the window", () => {
    expect(h.total).toBe(12);
    expect(h.activeDays).toBe(5);
  });

  it("copies counts and levels onto the cells", () => {
    const cell = h.weeks.flat().find((c) => c?.date === "2025-11-03");
    expect(cell).toMatchObject({ count: 5, level: 3 });
  });

  it("finds the busiest month", () => {
    expect(h.busiest).toEqual({ label: "Nov", total: 7 });
  });
});

describe("streaks", () => {
  it("longest streak counts consecutive days", () => {
    const h = buildHeatmap({ "2026-09-01": 1, "2026-09-02": 1, "2026-09-03": 1, "2026-09-05": 1 }, END);
    expect(h.longestStreak).toBe(3);
    expect(h.currentStreak).toBe(0);
  });

  it("current streak runs up to the end date", () => {
    const h = buildHeatmap({ "2026-10-05": 1, "2026-10-06": 1, "2026-10-07": 2 }, END);
    expect(h.currentStreak).toBe(3);
  });

  it("current streak is still alive if the last active day was yesterday", () => {
    const h = buildHeatmap({ "2026-10-04": 1, "2026-10-05": 1, "2026-10-06": 1 }, END);
    expect(h.currentStreak).toBe(3);
  });

  it("current streak is zero after a gap of two days", () => {
    const h = buildHeatmap({ "2026-10-04": 1, "2026-10-05": 1 }, END);
    expect(h.currentStreak).toBe(0);
  });
});

describe("month labels", () => {
  const h = buildHeatmap({}, END);

  it("labels each month where it starts", () => {
    expect(h.months.map((m) => m.label)).toEqual([
      "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct",
    ]);
    expect(h.months[0].week).toBe(0);
    expect(h.months[1].week).toBe(3);
  });

  it("never puts two labels closer than three columns", () => {
    for (let i = 1; i < h.months.length; i++) {
      expect(h.months[i].week - h.months[i - 1].week).toBeGreaterThanOrEqual(3);
    }
  });
});
