import { describe, expect, it } from "vitest";
import { LeetcodeSchema } from "@/lib/schema";
import { buildLeetcodeData, type ApiResponse } from "./leetcode-data";

// unix seconds for UTC midnight of the given ISO date
const ts = (iso: string) => String(Date.parse(`${iso}T00:00:00Z`) / 1000);

const NOW = new Date("2026-10-06T20:30:00Z");

function response(overrides: Partial<ApiResponse["data"]> = {}): ApiResponse {
  return {
    data: {
      matchedUser: {
        submitStatsGlobal: {
          acSubmissionNum: [
            { difficulty: "All", count: 603 },
            { difficulty: "Easy", count: 216 },
            { difficulty: "Medium", count: 317 },
            { difficulty: "Hard", count: 70 },
          ],
        },
        userCalendar: {
          totalActiveDays: 999, // deliberately wrong: we count days ourselves
          submissionCalendar: JSON.stringify({
            [ts("2025-10-05")]: 7, // before the window
            [ts("2025-10-08")]: 2, // first day of the window
            [ts("2026-07-26")]: 4,
            [ts("2026-10-06")]: 1, // last day of the window
          }),
        },
      },
      userContestRanking: { rating: 1533.076, topPercentage: 36.31, attendedContestsCount: 11 },
      ...overrides,
    },
  };
}

describe("buildLeetcodeData", () => {
  it("produces data that passes the schema", () => {
    expect(LeetcodeSchema.safeParse(buildLeetcodeData(response(), NOW)).success).toBe(true);
  });

  it("maps the solved counts", () => {
    const d = buildLeetcodeData(response(), NOW);
    expect([d.solved, d.easy, d.medium, d.hard]).toEqual([603, 216, 317, 70]);
  });

  it("turns unix timestamps into ISO dates and drops days outside the window", () => {
    const d = buildLeetcodeData(response(), NOW);
    expect(d.calendar).toEqual({ "2025-10-08": 2, "2026-07-26": 4, "2026-10-06": 1 });
  });

  it("counts active days from the calendar, not from the API total", () => {
    expect(buildLeetcodeData(response(), NOW).activeDays).toBe(3);
  });

  it("maps contest data and the fetch time", () => {
    const d = buildLeetcodeData(response(), NOW);
    expect([d.rating, d.topPercent, d.contests]).toEqual([1533.076, 36.31, 11]);
    expect(d.fetchedAt).toBe("2026-10-06T20:30:00.000Z");
  });

  it("copes with a user who has never entered a contest", () => {
    const d = buildLeetcodeData(response({ userContestRanking: null }), NOW);
    expect([d.rating, d.topPercent, d.contests]).toEqual([0, 100, 0]);
    expect(LeetcodeSchema.safeParse(d).success).toBe(true);
  });

  it("throws a clear error when the user is not found", () => {
    expect(() => buildLeetcodeData(response({ matchedUser: null }), NOW)).toThrow(/user not found/i);
  });
});
