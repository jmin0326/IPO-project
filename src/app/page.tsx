"use client";

// 메인 화면.
//
//  - 왼쪽: 진단 카드(누르면 상세 진단으로) + 달력 + 고른 날짜 패널
//  - 오른쪽: 전체 점검(중복·묶음·몰림) + 추천 목록
//
// 진단은 항상 '이번 달' 기준으로 계산한다. 달력은 지난달도 넘겨 볼 수 있지만,
// 달력을 넘긴다고 진단까지 바뀌면 헷갈리므로 둘을 일부러 분리했다.

import { useState } from "react";
import Link from "next/link";
import Calendar, {
  type CalendarBilling,
  type CalendarUsage,
} from "@/components/Calendar";
import DiagnosisCard from "@/components/DiagnosisCard";
import PortfolioNotices from "@/components/PortfolioNotices";
import SubscriptionCard from "@/components/SubscriptionCard";
import { CATEGORIES, findService, serviceColor, serviceName } from "@/data/services";
import {
  buildStats,
  findPortfolioIssues,
  judgeHabit,
  maxSaving,
  savingSuggestions,
  sortByPriority,
  totalMonthlyCost,
} from "@/lib/analyze";
import {
  billingDayInMonth,
  formatDateKey,
  monthKeyOf,
  shiftMonth,
} from "@/lib/date";
import { won } from "@/lib/format";
import {
  removeUsageLog,
  resetToSeed,
  setUsageMinutes,
  toggleUsageLog,
  useAppData,
} from "@/lib/store";
import { useToday } from "@/lib/today";
import { useIsClient } from "@/lib/useIsClient";

export default function Home() {
  const isClient = useIsClient();
  const data = useAppData();
  const today = useToday();
  // 달력을 몇 달 옮겨 보고 있는지. 오늘 날짜를 바꾸면 달력도 같이 따라오도록
  // 절대 월이 아니라 '오늘로부터 몇 달'로 들고 있는다.
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 서버에서 미리 그릴 때는 오늘 날짜와 저장된 데이터를 알 수 없으므로
  // 자리만 잡아 두고, 브라우저에서 진짜 내용을 그린다.
  if (!isClient) {
    return (
      <main className="mx-auto w-full max-w-5xl px-5 py-10">
        <h1 className="text-2xl font-bold text-ink">구독 습관 진단기</h1>
        <p className="mt-6 text-sm text-ink-soft">불러오는 중…</p>
      </main>
    );
  }

  const thisMonth = monthKeyOf(today);
  const viewMonth = shiftMonth(thisMonth, monthOffset);

  const stats = buildStats(data, thisMonth);
  const ranked = sortByPriority(stats);
  const habit = judgeHabit(stats);
  const issues = findPortfolioIssues(data, stats);

  // 달력에 찍을 이용 기록 (보고 있는 달만)
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
      name: serviceName(subscription.serviceId),
      color: serviceColor(subscription.serviceId),
    });
    usageByDate.set(log.date, list);
  }

  // 달력에 찍을 결제일
  const billingByDay = new Map<number, CalendarBilling[]>();
  for (const subscription of data.subscriptions) {
    const day = billingDayInMonth(subscription.billingDay, viewMonth);
    const list = billingByDay.get(day) ?? [];
    list.push({
      name: serviceName(subscription.serviceId),
      price: subscription.monthlyPrice,
    });
    billingByDay.set(day, list);
  }

  // 범례는 실제로 구독 중인 카테고리만 보여 준다.
  const usedCategories = CATEGORIES.filter((category) =>
    data.subscriptions.some(
      (subscription) => findService(subscription.serviceId)?.category === category.id,
    ),
  );

  const selectedBillings = selectedDate
    ? (billingByDay.get(Number(selectedDate.slice(8, 10))) ?? [])
    : [];

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10">
      <h1 className="text-2xl font-bold text-ink">구독 습관 진단기</h1>
      <p className="mt-1 text-sm text-ink-soft">
        얼마나 쓰는지 기록하면, 끊을지 낮출지 바꿀지 골라 드립니다.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:items-start">
        {/* 왼쪽: 진단 + 달력 */}
        <div className="space-y-4">
          <DiagnosisCard
            habitType={habit.type}
            oneLineDiagnosis={habit.oneLine}
            totalCost={totalMonthlyCost(stats)}
            saving={maxSaving(stats)}
            fixCount={savingSuggestions(stats).length}
          />

          <Link
            href="/usage"
            className="block w-full rounded-2xl bg-diag-deep px-5 py-4 text-center font-semibold text-diag-ink shadow-sm"
          >
            이번 달 이용 횟수 입력
          </Link>

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

          {/* 달력에서 하루를 고르면 그날 기록을 보고 고칠 수 있다. */}
          {selectedDate && (
            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-baseline justify-between">
                <h3 className="font-semibold text-ink">
                  {formatDateKey(selectedDate)}
                </h3>
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

                      return (
                        <li
                          key={subscription.id}
                          className="flex items-center gap-2"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              toggleUsageLog(subscription.id, selectedDate)
                            }
                            className={`flex flex-1 items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-sm transition ${
                              log
                                ? "border-transparent bg-diag font-semibold text-diag-ink"
                                : "border-zinc-200 bg-white text-ink-soft"
                            }`}
                          >
                            <span
                              className="size-1.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor: serviceColor(subscription.serviceId),
                              }}
                            />
                            {serviceName(subscription.serviceId)}
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

        {/* 오른쪽: 전체 점검 + 추천 목록 */}
        <div className="space-y-6">
          <PortfolioNotices issues={issues} />

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold text-ink">구독별 추천</h2>
              <p className="text-xs text-ink-soft">손볼 게 큰 순서</p>
            </div>

            {ranked.length === 0 ? (
              <p className="rounded-2xl bg-white p-6 text-sm text-ink-soft shadow-sm">
                아직 등록한 구독이 없습니다. 아래에서 구독을 추가해 주세요.
              </p>
            ) : (
              <ul className="space-y-3">
                {ranked.map((stat, index) => (
                  <SubscriptionCard
                    key={stat.subscription.id}
                    rank={index + 1}
                    stat={stat}
                    usedToday={data.usageLogs.some(
                      (log) =>
                        log.subscriptionId === stat.subscription.id &&
                        log.date === today,
                    )}
                    onToggleToday={() =>
                      toggleUsageLog(stat.subscription.id, today)
                    }
                  />
                ))}
              </ul>
            )}

            <Link
              href="/subscriptions/new"
              className="block w-full rounded-2xl border-2 border-dashed border-list-deep px-5 py-4 text-center font-semibold text-list-ink"
            >
              + 구독 추가
            </Link>
          </div>
        </div>
      </div>

      <footer className="mt-10 flex flex-wrap items-center gap-3 text-xs text-ink-soft">
        <span>
          ※ 입력한 내용은 지금 쓰는 브라우저에만 저장됩니다. (차시 7에서 Supabase로
          옮길 예정)
        </span>
        <button
          type="button"
          onClick={resetToSeed}
          className="underline underline-offset-2"
        >
          샘플 데이터로 되돌리기
        </button>
      </footer>
    </main>
  );
}
