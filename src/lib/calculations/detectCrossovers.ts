import type { OIDataPoint, OICrossoverEvent } from "@/types";

export function detectAllCrossovers(data: OIDataPoint[]): OICrossoverEvent[] {
  if (data.length === 0) return [];
  const events: OICrossoverEvent[] = [];
  let currentLeader: "calls" | "puts" =
    data[0].callOI >= data[0].putOI ? "calls" : "puts";

  for (let i = 1; i < data.length; i++) {
    const { callOI, putOI, date } = data[i];
    if (currentLeader === "calls" && putOI > callOI) {
      events.push({ date, index: i, direction: "puts_lead", callOIAtCross: callOI, putOIAtCross: putOI });
      currentLeader = "puts";
    } else if (currentLeader === "puts" && callOI >= putOI) {
      events.push({ date, index: i, direction: "calls_lead", callOIAtCross: callOI, putOIAtCross: putOI });
      currentLeader = "calls";
    }
  }
  return events;
}
