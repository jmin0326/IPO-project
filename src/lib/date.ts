// 날짜 계산 도우미.
//
// 주의: toISOString()은 UTC 기준이라 한국 시간으로 밤이면 날짜가 하루 밀린다.
// 그래서 여기서는 전부 지역 시간(getFullYear/getMonth/getDate)으로 직접 만든다.

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Date -> "YYYY-MM-DD" */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** 오늘 날짜 "YYYY-MM-DD" */
export function todayKey(): string {
  return toDateKey(new Date());
}

/** 이번 달 "YYYY-MM" */
export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
}

/** "2026-09-28" -> "2026-09" */
export function monthKeyOf(dateKey: string): string {
  return dateKey.slice(0, 7);
}

/** "2026-09" + 15 -> "2026-09-15" */
export function dayKey(monthKey: string, day: number): string {
  return `${monthKey}-${pad2(day)}`;
}

/** 그 달이 며칠까지 있는지 */
export function daysInMonth(monthKey: string): number {
  const [year, month] = monthKey.split("-").map(Number);
  // 다음 달 0일 = 이번 달 마지막 날
  return new Date(year, month, 0).getDate();
}

/** 그 달 1일이 무슨 요일인지 (0=일요일) */
export function firstWeekdayOf(monthKey: string): number {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).getDay();
}

/** "YYYY-MM-DD"가 무슨 요일인지 (0=일요일) */
export function weekdayOf(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

/** 날짜 이동. shiftDay("2026-09-30", 1) -> "2026-10-01" */
export function shiftDay(dateKey: string, delta: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  // Date는 31일 + 1 같은 계산을 알아서 다음 달로 넘겨 준다.
  return toDateKey(new Date(year, month - 1, day + delta));
}

/** 달 이동. shiftMonth("2026-01", -1) -> "2025-12" */
export function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const moved = new Date(year, month - 1 + delta, 1);
  return `${moved.getFullYear()}-${pad2(moved.getMonth() + 1)}`;
}

/** "2026-09" -> "2026년 9월" */
export function formatMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${year}년 ${month}월`;
}

/** "2026-09-28" -> "9월 28일 (월)" */
export function formatDateKey(dateKey: string): string {
  const [, month, day] = dateKey.split("-").map(Number);
  return `${month}월 ${day}일 (${WEEKDAY_LABELS[weekdayOf(dateKey)]})`;
}

/**
 * 결제일이 그 달에 실제로 존재하는 날인지 맞춰 준다.
 * 31일 결제인데 2월이면 28(29)일로 당긴다.
 */
export function billingDayInMonth(billingDay: number, monthKey: string): number {
  return Math.min(billingDay, daysInMonth(monthKey));
}
