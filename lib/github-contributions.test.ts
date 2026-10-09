import { describe, expect, it } from "vitest";
import { parseContributions } from "@/lib/github-contributions";

// The markup of github.com/users/<name>/contributions: a cell per day, and a tooltip
// (linked by id) that holds the count.
const cell = (date: string, id: string, level = 0) =>
  `<td tabindex="0" data-ix="0" style="width: 11px" data-date="${date}" id="${id}" data-level="${level}" role="gridcell" class="ContributionCalendar-day"></td>`;
const tip = (id: string, text: string) =>
  `<tool-tip for="${id}" popover="manual" data-type="label" class="sr-only position-absolute">${text}</tool-tip>`;

const PAGE = `
<table><tbody><tr>
  ${cell("2026-03-01", "contribution-day-component-0-0", 3)}
  ${cell("2026-03-02", "contribution-day-component-0-1", 0)}
  ${cell("2026-03-03", "contribution-day-component-0-2", 1)}
  ${cell("2026-03-04", "contribution-day-component-0-3", 4)}
</tr></tbody></table>
${tip("contribution-day-component-0-0", "4 contributions on March 1st.")}
${tip("contribution-day-component-0-1", "No contributions on March 2nd.")}
${tip("contribution-day-component-0-2", "1 contribution on March 3rd.")}
${tip("contribution-day-component-0-3", "1,204 contributions on March 4th.")}
`;

describe("parseContributions", () => {
  it("maps each day to its count, joining cell and tooltip by id", () => {
    expect(parseContributions(PAGE)).toEqual({
      "2026-03-01": 4,
      "2026-03-03": 1,
      "2026-03-04": 1204,
    });
  });

  it("leaves out days with no contributions", () => {
    expect(parseContributions(PAGE)["2026-03-02"]).toBeUndefined();
  });

  it("returns an empty calendar for a page that is not the contribution graph", () => {
    expect(parseContributions("<html><body>Rate limited</body></html>")).toEqual({});
  });

  it("ignores a cell whose tooltip is missing instead of guessing a count", () => {
    const html = cell("2026-03-05", "contribution-day-component-0-9", 2);
    expect(parseContributions(html)).toEqual({});
  });
});
