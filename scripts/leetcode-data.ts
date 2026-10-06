import type { Leetcode } from "../lib/schema";

// The part of LeetCode's GraphQL response we read.
export type ApiResponse = {
  data: {
    matchedUser: {
      submitStatsGlobal: { acSubmissionNum: { difficulty: string; count: number }[] };
      userCalendar: { totalActiveDays: number; submissionCalendar: string };
    } | null;
    userContestRanking: { rating: number; topPercentage: number; attendedContestsCount: number } | null;
  };
};

export const QUERY = `query($u:String!){
  matchedUser(username:$u){
    submitStatsGlobal{acSubmissionNum{difficulty count}}
    userCalendar{totalActiveDays submissionCalendar}
  }
  userContestRanking(username:$u){rating topPercentage attendedContestsCount}
}`;

const DAY = 86_400_000;

export function buildLeetcodeData(res: ApiResponse, now: Date): Leetcode {
  const user = res.data.matchedUser;
  if (!user) throw new Error("LeetCode user not found");

  const solved = (name: string) =>
    user.submitStatsGlobal.acSubmissionNum.find((x) => x.difficulty === name)?.count ?? 0;

  // keep only the 365 days ending today (UTC), keyed by ISO date
  const endMs = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  const startMs = endMs - 364 * DAY;
  const raw = JSON.parse(user.userCalendar.submissionCalendar) as Record<string, number>;
  const calendar: Record<string, number> = {};
  for (const [unix, count] of Object.entries(raw)) {
    const ms = Number(unix) * 1000;
    if (ms >= startMs && ms <= endMs && count > 0) {
      calendar[new Date(ms).toISOString().slice(0, 10)] = count;
    }
  }

  const contest = res.data.userContestRanking;
  return {
    fetchedAt: now.toISOString(),
    solved: solved("All"),
    easy: solved("Easy"),
    medium: solved("Medium"),
    hard: solved("Hard"),
    activeDays: Object.keys(calendar).length,
    calendar,
    rating: contest?.rating ?? 0,
    topPercent: contest?.topPercentage ?? 100,
    contests: contest?.attendedContestsCount ?? 0,
  };
}
