"use client";

// 이용 기록 달력.
//
// 한 칸(하루)에 두 가지를 같이 보여 준다.
//  - 그날 쓴 서비스: 카테고리 색 점
//  - 그날 결제되는 구독: ₩ 배지
// 그래서 "15일에 17,000원이 빠져나갔는데 그 주에 한 번도 안 봤네" 같은 게 보인다.

import {
  WEEKDAY_LABELS,
  dayKey,
  daysInMonth,
  firstWeekdayOf,
  formatMonthKey,
} from "@/lib/date";

export type CalendarUsage = {
  subscriptionId: string;
  name: string;
  color: string;
};

export type CalendarBilling = {
  name: string;
  price: number;
};

type Props = {
  monthKey: string;
  /** "YYYY-MM-DD" -> 그날 이용한 구독들 */
  usageByDate: Map<string, CalendarUsage[]>;
  /** 날짜(며칠) -> 그날 결제되는 구독들 */
  billingByDay: Map<number, CalendarBilling[]>;
  todayDateKey: string;
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
  onChangeMonth: (delta: number) => void;
};

const MAX_DOTS = 3;

export default function Calendar({
  monthKey,
  usageByDate,
  billingByDay,
  todayDateKey,
  selectedDate,
  onSelectDate,
  onChangeMonth,
}: Props) {
  const lastDay = daysInMonth(monthKey);
  const leadingBlanks = firstWeekdayOf(monthKey);

  const days = Array.from({ length: lastDay }, (_, index) => index + 1);

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChangeMonth(-1)}
          aria-label="이전 달"
          className="rounded-lg px-3 py-1 text-lg text-ink-soft hover:bg-page"
        >
          ‹
        </button>
        <h2 className="font-semibold text-ink">{formatMonthKey(monthKey)}</h2>
        <button
          type="button"
          onClick={() => onChangeMonth(1)}
          aria-label="다음 달"
          className="rounded-lg px-3 py-1 text-lg text-ink-soft hover:bg-page"
        >
          ›
        </button>
      </header>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={label}
            className={`pb-1 text-center text-xs ${
              index === 0
                ? "text-red-500"
                : index === 6
                  ? "text-blue-500"
                  : "text-ink-soft"
            }`}
          >
            {label}
          </div>
        ))}

        {Array.from({ length: leadingBlanks }, (_, index) => (
          <div key={`blank-${index}`} />
        ))}

        {days.map((day) => {
          const dateKey = dayKey(monthKey, day);
          const usages = usageByDate.get(dateKey) ?? [];
          const billings = billingByDay.get(day) ?? [];
          const isToday = dateKey === todayDateKey;
          const isSelected = dateKey === selectedDate;
          const weekday = (leadingBlanks + day - 1) % 7;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              className={`flex min-h-14 flex-col items-center rounded-lg border p-1 transition ${
                isSelected
                  ? "border-diag-deep bg-diag"
                  : isToday
                    ? "border-diag-deep bg-white"
                    : "border-transparent bg-page hover:border-diag-deep"
              }`}
            >
              <span className="flex items-center gap-0.5 text-xs">
                <span
                  className={
                    weekday === 0
                      ? "text-red-500"
                      : weekday === 6
                        ? "text-blue-500"
                        : "text-ink"
                  }
                >
                  {day}
                </span>
                {billings.length > 0 && (
                  <span
                    title={billings.map((item) => item.name).join(", ")}
                    className="rounded bg-list px-1 text-[10px] font-semibold text-list-ink"
                  >
                    ₩
                  </span>
                )}
              </span>

              <span className="mt-1 flex flex-wrap items-center justify-center gap-0.5">
                {usages.slice(0, MAX_DOTS).map((usage) => (
                  <span
                    key={usage.subscriptionId}
                    title={usage.name}
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: usage.color }}
                  />
                ))}
                {usages.length > MAX_DOTS && (
                  <span className="text-[10px] leading-none text-ink-soft">
                    +{usages.length - MAX_DOTS}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
