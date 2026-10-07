"use client";

// 상세 진단 화면.
//
// 처음에는 계산 과정을 ①~⑥으로 전부 펼쳐 놨는데 읽기가 너무 어려웠다.
// 그래서 순서를 뒤집었다.
//   1. 결론 (유형과 금액)
//   2. 이렇게 해 보세요 (할 일 목록)
//   3. 그대로 둬도 되는 것
//   4. 숫자가 어떻게 나왔는지 — 접어 두고 궁금한 사람만 펼쳐 본다
//
// 근거를 숨긴 게 아니라 '먼저 보여 줄 것'과 '찾아볼 것'을 나눈 것이다.

import Link from "next/link";
import SuggestionBadge from "@/components/SuggestionBadge";
import { CATEGORIES } from "@/data/services";
import {
  HABIT_RULES,
  INTENSITY_LABELS,
  buildActionPlan,
  buildStats,
  judgeHabit,
  limitsFor,
  sortByPriority,
  totalMonthlyCost,
} from "@/lib/analyze";
import { formatMonthKey, monthKeyOf } from "@/lib/date";
import { won } from "@/lib/format";
import { useAppData } from "@/lib/store";
import { useToday } from "@/lib/today";
import { useIsClient } from "@/lib/useIsClient";

export default function DiagnosisPage() {
  const isClient = useIsClient();
  const data = useAppData();
  const today = useToday();

  if (!isClient) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-10">
        <p className="text-sm text-ink-soft">불러오는 중…</p>
      </main>
    );
  }

  const month = monthKeyOf(today);
  const stats = buildStats(data, month);
  const ranked = sortByPriority(stats);
  const habit = judgeHabit(stats);
  const total = totalMonthlyCost(stats);
  const plan = buildActionPlan(data, stats);

  // 할 일 목록에 한 번도 안 나온 구독 = 그대로 둬도 되는 것
  const fine = ranked.filter((stat) => !plan.touched.has(stat.subscription.id));

  const usedCategories = CATEGORIES.filter((category) =>
    stats.some((stat) => stat.service?.category === category.id),
  );

  if (stats.length === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-10">
        <Link href="/" className="text-sm text-ink-soft">
          ‹ 돌아가기
        </Link>
        <p className="mt-6 rounded-2xl bg-white p-6 text-sm text-ink-soft shadow-sm">
          등록된 구독이 없어서 진단할 수 없습니다. 먼저 구독을 등록해 주세요.
        </p>
      </main>
    );
  }

  let step = 0;

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <Link href="/" className="text-sm text-ink-soft">
        ‹ 돌아가기
      </Link>

      {/* 1. 결론 */}
      <section className="mt-3 rounded-2xl bg-diag p-6 shadow-sm">
        <p className="text-sm text-diag-ink/70">{formatMonthKey(month)} 진단</p>
        <p className="mt-1 text-3xl font-bold text-ink">
          당신은 <span className="text-diag-ink">&ldquo;{habit.type}&rdquo;</span>
        </p>
        <p className="mt-1 text-ink-soft">{habit.oneLine}</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white p-4">
            <p className="text-xs text-ink-soft">지금 매달 나가는 돈</p>
            <p className="mt-1 text-2xl font-bold text-ink">{won(total)}</p>
          </div>
          <div className="rounded-xl bg-white p-4">
            <p className="text-xs text-ink-soft">아래대로 하면</p>
            <p className="mt-1 text-2xl font-bold text-list-ink">
              {plan.total > 0 ? `−${won(plan.total)}` : "줄일 것 없음"}
            </p>
          </div>
        </div>
      </section>

      {/* 2. 할 일 */}
      <h2 className="mt-8 text-lg font-bold text-ink">이렇게 해 보세요</h2>

      {plan.items.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-white p-6 text-sm text-ink-soft shadow-sm">
          손볼 것이 없습니다. 지금 구성이 괜찮다는 뜻입니다.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {plan.items.map((item) => {
            if (!item.alternative) step += 1;

            return (
              <li
                key={item.key}
                className={`rounded-2xl p-5 shadow-sm ${
                  item.alternative ? "bg-page" : "bg-white"
                }`}
              >
                <div className="flex gap-3">
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      item.alternative
                        ? "bg-white text-ink-soft"
                        : "bg-list-deep text-list-ink"
                    }`}
                  >
                    {item.alternative ? "또" : step}
                  </span>

                  <div className="min-w-0 flex-1">
                    {item.alternative && (
                      <p className="mb-1 text-xs text-ink-soft">
                        위 대신 이렇게 할 수도 있습니다 (둘 다는 못 합니다)
                      </p>
                    )}

                    <p className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-page px-1.5 py-0.5 text-[11px] font-semibold text-ink-soft">
                        {item.badge}
                      </span>
                      <span className="font-semibold text-ink">{item.title}</span>
                    </p>

                    {item.saving > 0 && (
                      <p className="mt-1 text-lg font-bold text-list-ink">
                        매달 {won(item.saving)} 절약
                      </p>
                    )}

                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                      {item.why}
                    </p>

                    {item.caution && (
                      <p className="mt-2 rounded-lg bg-list px-3 py-2 text-sm text-list-ink">
                        {item.cautionIsTradeoff ? "대신 포기해야 합니다 — " : "참고 — "}
                        {item.caution}
                      </p>
                    )}

                    {item.subscriptionId && (
                      <Link
                        href={`/subscriptions/${item.subscriptionId}`}
                        className="mt-2 inline-block text-sm font-semibold text-diag-ink"
                      >
                        여기서 바로 바꾸기 ›
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 3. 그대로 둬도 되는 것 */}
      {fine.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-bold text-ink">이건 그대로 두세요</h2>
          <ul className="mt-3 space-y-2">
            {fine.map((stat) => (
              <li
                key={stat.subscription.id}
                className="flex flex-wrap items-center gap-2 rounded-xl bg-page px-4 py-3 text-sm"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: stat.color }}
                />
                <span className="font-semibold text-ink">{stat.name}</span>
                <span className="text-ink-soft">
                  월 {stat.usageCount}회 · {INTENSITY_LABELS[stat.intensity]}
                </span>
                <SuggestionBadge kind={stat.primary.kind} />
              </li>
            ))}
          </ul>
        </>
      )}

      {/* 4. 계산 과정 — 궁금한 사람만 펼쳐 본다 */}
      <details className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
        <summary className="cursor-pointer font-semibold text-ink">
          이 숫자들은 어떻게 나왔나요?
        </summary>

        <div className="mt-5 space-y-6 text-sm">
          <div>
            <h3 className="font-semibold text-ink">1. 얼마나 썼는지 셉니다</h3>
            <p className="mt-1 text-xs text-ink-soft">
              달력에 남긴 기록을 세되, 월 단위로 몰아서 입력한 값이 있으면 그쪽을
              씁니다.
            </p>
            <ul className="mt-2 space-y-1">
              {stats.map((stat) => (
                <li
                  key={stat.subscription.id}
                  className="flex flex-wrap justify-between gap-2 border-b border-zinc-100 pb-1"
                >
                  <span className="text-ink">{stat.name}</span>
                  <span className="text-ink-soft">
                    {stat.usageCount}회
                    {stat.countSource === "manual" && " (몰아 입력)"}
                    {stat.averageMinutes !== null &&
                      ` · 한 번에 평균 ${stat.averageMinutes}분`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-ink">
              2. 몇 번부터 &lsquo;자주&rsquo;인지는 종류마다 다릅니다
            </h3>
            <p className="mt-1 text-xs text-ink-soft">
              같은 26회라도 음악은 평범하고 영상은 많이 보는 편입니다. 아래 숫자는
              정답이 아니라 제가 정한 기준선입니다.
            </p>
            <ul className="mt-2 space-y-1">
              {usedCategories.map((category) => {
                const sample = stats.find(
                  (stat) =>
                    stat.service?.category === category.id &&
                    !stat.service?.intensityLimits,
                )?.service;
                if (!sample) return null;

                return (
                  <li
                    key={category.id}
                    className="flex flex-wrap justify-between gap-2 border-b border-zinc-100 pb-1"
                  >
                    <span className="text-ink">{category.label}</span>
                    <span className="text-ink-soft">
                      {limitsFor(sample).medium + 1}회부터 자주
                    </span>
                  </li>
                );
              })}
              {stats
                .filter((stat) => stat.service?.intensityLimits)
                .map((stat) => (
                  <li
                    key={`own-${stat.subscription.id}`}
                    className="flex flex-wrap justify-between gap-2 border-b border-zinc-100 pb-1"
                  >
                    <span className="text-ink">{stat.name}만 따로</span>
                    <span className="text-ink-soft">
                      {limitsFor(stat.service).medium + 1}회부터 자주 —{" "}
                      {limitsFor(stat.service).note}
                    </span>
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-ink">
              3. 1회당 얼마인지도 같이 봅니다
            </h3>
            <p className="mt-1 text-xs text-ink-soft">
              판단 기준은 아니고 참고용입니다. 많이 쓸수록 무조건 좋다고 하면
              &lsquo;요금제를 올리세요&rsquo;라는 말이 나올 수 없기 때문입니다.
            </p>
            <ul className="mt-2 space-y-1">
              {stats.map((stat) => (
                <li
                  key={stat.subscription.id}
                  className="flex flex-wrap justify-between gap-2 border-b border-zinc-100 pb-1"
                >
                  <span className="text-ink">{stat.name}</span>
                  <span className="font-mono text-xs text-ink-soft">
                    {won(stat.subscription.monthlyPrice)} ÷ {stat.usageCount}회 ={" "}
                    {stat.costPerUse === null ? "계산 불가" : won(stat.costPerUse)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-ink">
              4. 습관 유형은 이렇게 정합니다
            </h3>
            <p className="mt-1 text-xs text-ink-soft">
              위에서부터 보다가 처음 걸리는 것으로 정합니다. 지금 내 상태 — 구독{" "}
              {habit.facts.total}개, 한 번도 안 쓴 구독 {habit.facts.unusedCount}개,
              손볼 구독 {habit.facts.fixableCount}개, 자주 쓰는 구독{" "}
              {habit.facts.heavyCount}개
            </p>
            <ul className="mt-2 space-y-1">
              {HABIT_RULES.map((rule) => {
                const isMatched = rule.type === habit.type;
                return (
                  <li
                    key={rule.type}
                    className={`flex flex-wrap justify-between gap-2 rounded px-2 py-1 ${
                      isMatched ? "bg-diag font-semibold text-diag-ink" : ""
                    }`}
                  >
                    <span className={isMatched ? "" : "text-ink-soft"}>
                      {rule.type}
                      {isMatched && " ← 여기"}
                    </span>
                    <span className="text-ink-soft">{rule.criteria}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </details>
    </main>
  );
}
