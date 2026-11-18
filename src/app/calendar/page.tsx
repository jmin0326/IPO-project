"use client";

// 이용 기록 달력 화면.
//
// 원래는 메인 화면 왼쪽에 있었는데, 메인이 너무 복잡하다는 피드백을 받아 떼어 냈다.
// 달력은 '진단 결과'가 아니라 '기록하는 도구'라서 메인에 꼭 있어야 하는 건 아니다.
// 매일 쓰는 기록은 메인 구독 목록의 '이용함' 버튼으로 그대로 할 수 있고,
// 날짜를 거슬러 올라가 고치는 일만 여기서 한다.

import { useState } from "react";
import Link from "next/link";
import Calendar, {
  type CalendarBilling,
  type CalendarUsage,
} from "@/components/Calendar";
import ServiceTile from "@/components/ServiceTile";
import { CATEGORIES, findService, serviceColor, serviceName } from "@/data/services";
import {
  billingDayInMonth,
  formatDateKey,
  monthKeyOf,
  shiftMonth,
} from "@/lib/date";
import { won } from "@/lib/format";
import {
  removeUsageLog,
  setUsageMinutes,
  toggleUsageLog,
  useAppData,
} from "@/lib/store";
import { useToday } from "@/lib/today";
import { useIsClient } from "@/lib/useIsClient";

export default function CalendarPage() {
  const isClient = useIsClient();
  const data = useAppData();
  const today = useToday();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (!isClient) {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-10">
        <p className="text-sm text-ink-soft">불러오는 중…</p>
      </main>
    );
  }

  const viewMonth = shiftMonth(monthKeyOf(today), monthOffset);

  const usageByDate = new Map<string, CalendarUsage[]>();
  for (const log of data.usageLogs) {
    if (monthKeyOf(log.date) !== viewMonth) continue;

    const subscription = data.subscriptions.find(
      (item) => item.id === log.subscriptionId,
    );
    if (!subscription) continue;

    const list = usageByDate.get(log.date) ?? [];
    list.push({
      subscriptionId: subscription.id,
      name: subscription.customName ?? serviceName(subscription.serviceId),
      color: serviceColor(subscription.serviceId),
    });
    usageByDate.set(log.date, list);
  }

  // 결제일은 아직 쓰고 있는 구독만 찍는다. 해지했으면 더 빠져나가지 않는다.
  const billingByDay = new Map<number, CalendarBilling[]>();
  for (const subscription of data.subscriptions.filter(
    (item) => item.endedOn === null,
  )) {
    const day = billingDayInMonth(subscription.billingDay, viewMonth);
    const list = billingByDay.get(day) ?? [];
    list.push({
      name: subscription.customName ?? serviceName(subscription.serviceId),
      price: subscription.monthlyPrice,
    });
    billingByDay.set(day, list);
  }

  const usedCategories = CATEGORIES.filter((category) =>
    data.subscriptions.some(
      (subscription) => findService(subscription.serviceId)?.category === category.id,
    ),
  );

  const selectedBillings = selectedDate
    ? (billingByDay.get(Number(selectedDate.slice(8, 10))) ?? [])
    : [];

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-10">
      <Link href="/" className="text-sm text-ink-soft">
        ‹ 돌아가기
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-ink">이용 기록 달력</h1>
      <p className="mt-1 text-sm text-ink-soft">
        날짜를 누르면 그날 쓴 서비스와 시간을 고칠 수 있습니다.
      </p>

      <div className="mt-6 space-y-4">
        <Calendar
          monthKey={viewMonth}
          usageByDate={usageByDate}
          billingByDay={billingByDay}
          todayDateKey={today}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onChangeMonth={(delta) => {
            setMonthOffset(monthOffset + delta);
            setSelectedDate(null);
          }}
        />

        {usedCategories.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 px-1 text-xs text-ink-soft">
            {usedCategories.map((category) => (
              <span key={category.id} className="flex items-center gap-1">
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.label}
              </span>
            ))}
            <span className="flex items-center gap-1">
              <span className="rounded bg-list px-1 text-[10px] font-semibold text-list-ink">
                ₩
              </span>
              결제일
            </span>
          </div>
        )}

        {selectedDate && (
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold text-ink">{formatDateKey(selectedDate)}</h2>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="text-xs text-ink-soft underline underline-offset-2"
              >
                닫기
              </button>
            </div>

            {selectedBillings.length > 0 && (
              <p className="mt-2 rounded-lg bg-list px-3 py-2 text-sm text-list-ink">
                이 날 결제:{" "}
                {selectedBillings
                  .map((item) => `${item.name} ${won(item.price)}`)
                  .join(", ")}
              </p>
            )}

            {data.subscriptions.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">등록된 구독이 없습니다.</p>
            ) : (
              <>
                <p className="mt-3 text-xs text-ink-soft">
                  이 날 쓴 서비스를 켜고, 몇 분 썼는지 적어 주세요. 시간은 비워 둬도
                  됩니다.
                </p>

                <ul className="mt-2 space-y-1.5">
                  {data.subscriptions.map((subscription) => {
                    const log = data.usageLogs.find(
                      (item) =>
                        item.subscriptionId === subscription.id &&
                        item.date === selectedDate,
                    );

                    // 해지한 구독은 해지한 날 이후로는 더 기록할 수 없다.
                    // 다만 그 전 기록은 그대로 보이고 지울 수도 있다.
                    const closed =
                      subscription.endedOn !== null &&
                      selectedDate > subscription.endedOn;

                    return (
                      <li key={subscription.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={closed}
                          onClick={() => toggleUsageLog(subscription.id, selectedDate)}
                          title={
                            closed
                              ? `${subscription.endedOn}에 해지해서 이 날은 기록할 수 없습니다`
                              : undefined
                          }
                          className={`flex flex-1 items-center gap-2 rounded-xl border px-2 py-1.5 text-left text-sm transition ${
                            closed
                              ? "border-transparent bg-page text-ink-soft opacity-50"
                              : log
                                ? "border-transparent bg-diag font-semibold text-diag-ink"
                                : "border-zinc-200 bg-white text-ink-soft"
                          }`}
                        >
                          <ServiceTile serviceId={subscription.serviceId} size="sm" />
                          {subscription.customName ??
                            serviceName(subscription.serviceId)}
                          {closed && (
                            <span className="ml-auto text-[10px]">해지함</span>
                          )}
                        </button>

                        {log && (
                          <span className="flex shrink-0 items-baseline gap-1">
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              value={log.minutes || ""}
                              placeholder="0"
                              onChange={(event) =>
                                setUsageMinutes(
                                  subscription.id,
                                  selectedDate,
                                  Number(event.target.value),
                                )
                              }
                              className="w-16 rounded-lg bg-page px-2 py-1 text-right text-sm text-ink outline-none"
                            />
                            <span className="text-xs text-ink-soft">분</span>
                            <button
                              type="button"
                              onClick={() => removeUsageLog(log.id)}
                              aria-label="이 기록 지우기"
                              className="px-1 text-xs text-ink-soft"
                            >
                              ✕
                            </button>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
