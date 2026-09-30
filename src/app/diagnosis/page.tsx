"use client";

// 상세 진단 화면.
//
// 메인 화면은 "방치형", "−28,900원" 같은 결론만 보여 준다.
// 이 화면은 그 숫자가 어떤 순서로 나왔는지를 ①~⑥으로 나눠서 보여 준다.
// 계획서 IPO 구조에서 가려져 있던 '처리(Process)'를 눈에 보이게 만든 화면이다.

import Link from "next/link";
import SuggestionBadge from "@/components/SuggestionBadge";
import { CATEGORIES, categoryLabel } from "@/data/services";
import {
  HABIT_RULES,
  INTENSITY_LABELS,
  INTENSITY_LIMITS,
  PORTFOLIO_LABELS,
  buildStats,
  findPortfolioIssues,
  judgeHabit,
  maxSaving,
  savingSuggestions,
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
      <main className="mx-auto w-full max-w-3xl px-5 py-10">
        <p className="text-sm text-ink-soft">불러오는 중…</p>
      </main>
    );
  }

  const month = monthKeyOf(today);
  const stats = buildStats(data, month);
  const ranked = sortByPriority(stats);
  const savers = savingSuggestions(stats);
  const issues = findPortfolioIssues(data, stats);
  const habit = judgeHabit(stats);
  const total = totalMonthlyCost(stats);
  const saving = maxSaving(stats);

  // 실제로 구독 중인 카테고리만 기준표에 보여 준다.
  const usedCategories = CATEGORIES.filter((category) =>
    stats.some((stat) => stat.service?.category === category.id),
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <Link href="/" className="text-sm text-ink-soft">
        ‹ 돌아가기
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-ink">
        {formatMonthKey(month)} 진단 자세히 보기
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        이 결과가 어떤 순서로 나왔는지 하나씩 보여 드립니다.
      </p>

      {stats.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-ink-soft shadow-sm">
          등록된 구독이 없어서 진단할 수 없습니다. 먼저 구독을 등록해 주세요.
        </p>
      ) : (
        <>
          <section className="mt-6 rounded-2xl bg-diag p-6 shadow-sm">
            <p className="text-2xl font-bold text-ink">
              당신은 <span className="text-diag-ink">&ldquo;{habit.type}&rdquo;</span>
            </p>
            <p className="mt-1 text-ink-soft">{habit.oneLine}</p>
            <p className="mt-4 text-sm text-ink">
              총 구독료 <strong>{won(total)}</strong> 중, 최대{" "}
              <strong>{won(saving)}</strong>까지 줄일 수 있습니다.
            </p>
          </section>

          {/* ① 이용 횟수 */}
          <Step
            number="①"
            title="이번 달에 얼마나 썼는지 셌습니다"
            note="달력에 남긴 기록을 세되, 월 단위로 몰아서 입력한 값이 있으면 그쪽을 씁니다. 이용 시간을 적어 두면 한 번에 얼마나 오래 쓰는지도 같이 봅니다."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-md text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-ink-soft">
                    <th className="py-2 font-medium">서비스</th>
                    <th className="py-2 text-right font-medium">달력</th>
                    <th className="py-2 text-right font-medium">몰아 입력</th>
                    <th className="py-2 text-right font-medium">쓰는 값</th>
                    <th className="py-2 text-right font-medium">한 번 평균</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat) => (
                    <tr
                      key={stat.subscription.id}
                      className="border-b border-zinc-100"
                    >
                      <td className="py-2 text-ink">{stat.name}</td>
                      <td className="py-2 text-right text-ink-soft">
                        {stat.loggedCount}회
                      </td>
                      <td className="py-2 text-right text-ink-soft">
                        {stat.manualCount === null ? "—" : `${stat.manualCount}회`}
                      </td>
                      <td className="py-2 text-right font-semibold text-ink">
                        {stat.usageCount}회
                      </td>
                      <td className="py-2 text-right text-ink-soft">
                        {stat.averageMinutes === null
                          ? "—"
                          : `${stat.averageMinutes}분`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Step>

          {/* ② 이용 강도 */}
          <Step
            number="②"
            title="카테고리 기준과 비교해 '이용 강도'를 정했습니다"
            note="같은 26회라도 음악은 평범하고 영상은 헤비 유저입니다. 그래서 하나의 기준으로 재지 않고 카테고리마다 경계를 따로 두었습니다. 아래 숫자는 정답이 있는 값이 아니라 제가 정한 기준선입니다."
          >
            <ul className="mb-4 space-y-2 text-sm">
              {usedCategories.map((category) => {
                const limits = INTENSITY_LIMITS[category.id];
                return (
                  <li key={category.id} className="rounded-lg bg-page px-3 py-2">
                    <p className="font-semibold text-ink">
                      {category.label} —{" "}
                      {limits.low === 1 ? "1회" : `1~${limits.low}회`} 거의 안 씀 ·{" "}
                      {limits.low + 1 === limits.medium
                        ? `${limits.medium}회`
                        : `${limits.low + 1}~${limits.medium}회`}{" "}
                      적당히 · {limits.medium + 1}회부터 자주
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">{limits.note}</p>
                  </li>
                );
              })}
            </ul>

            <ul className="space-y-1 text-sm">
              {stats.map((stat) => (
                <li
                  key={stat.subscription.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-100 pb-1"
                >
                  <span className="text-ink">
                    {stat.name}{" "}
                    <span className="text-xs text-ink-soft">
                      ({stat.service ? categoryLabel(stat.service.category) : "—"})
                    </span>
                  </span>
                  <span className="text-ink-soft">
                    {stat.usageCount}회 →{" "}
                    <strong className="text-ink">
                      {INTENSITY_LABELS[stat.intensity]}
                    </strong>
                  </span>
                </li>
              ))}
            </ul>
          </Step>

          {/* ③ 행동 고르기 */}
          <Step
            number="③"
            title="강도에 맞는 행동을 골랐습니다"
            note="안 쓰면 해지, 적게 쓰면 해지나 낮추기, 적당히 쓰면 요금제 낮추기, 보통이면 유지, 자주 쓰면 요금제를 올리거나 더 폭넓게 쓰이는 서비스로 갈아타기를 권합니다. 1회당 비용은 판정 기준이 아니라 참고 지표로만 씁니다. 많이 쓸수록 무조건 좋다고 하면 '올리세요'라는 추천이 나올 수 없기 때문입니다."
          >
            <ul className="space-y-2 text-sm">
              {ranked.map((stat, index) => (
                <li
                  key={stat.subscription.id}
                  className={`rounded-lg px-3 py-2 ${
                    stat.primary.kind === "keep" ? "bg-page" : "bg-list"
                  }`}
                >
                  <p className="flex flex-wrap items-center gap-2">
                    <strong className="text-ink">{index + 1}위.</strong>
                    <span className="text-ink">{stat.name}</span>
                    <SuggestionBadge kind={stat.primary.kind} />
                    <span className="text-ink">{stat.primary.title}</span>
                    {stat.primary.saving > 0 && (
                      <strong className="text-list-ink">
                        {won(stat.primary.saving)}
                      </strong>
                    )}
                  </p>
                  <p className="mt-1 text-ink-soft">{stat.primary.reason}</p>
                  {stat.costPerUse !== null && (
                    <p className="mt-0.5 text-xs text-ink-soft">
                      참고: {won(stat.subscription.monthlyPrice)} ÷ {stat.usageCount}
                      회 = 1회당 {won(stat.costPerUse)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Step>

          {/* ④ 절약액 */}
          <Step
            number="④"
            title="돈을 아끼는 추천만 모아 더했습니다"
            note="요금제를 올리라는 추천은 오히려 돈을 더 쓰는 것이라 뺐습니다. 추천을 전부 따랐을 때의 값이라 실제로는 이보다 덜 아끼게 됩니다. 그래서 '최대'라고 적었습니다."
          >
            {savers.length === 0 ? (
              <p className="text-sm text-ink-soft">
                줄일 것이 없습니다. 지금 구성이 괜찮다는 뜻입니다.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {savers.map((stat) => (
                  <li
                    key={stat.subscription.id}
                    className="flex justify-between text-ink-soft"
                  >
                    <span>
                      {stat.name} — {stat.primary.title}
                    </span>
                    <span>{won(stat.primary.saving)}</span>
                  </li>
                ))}
                <li className="flex justify-between border-t border-zinc-200 pt-2 font-semibold text-ink">
                  <span>절약 예상 최대</span>
                  <span>{won(saving)}</span>
                </li>
              </ul>
            )}
          </Step>

          {/* ⑤ 전체 점검 */}
          <Step
            number="⑤"
            title="구독을 묶어서 한 번 더 봤습니다"
            note="구독을 하나씩 따로만 보면 절대 못 찾는 낭비가 있습니다. 이미 다른 멤버십에 들어 있는 서비스를 따로 결제하거나, 같은 카테고리를 여러 개 들고 있으면서 정작 잘 안 쓰는 경우입니다."
          >
            {issues.length === 0 ? (
              <p className="text-sm text-ink-soft">
                중복 결제나 겹치는 구독은 없습니다.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {issues.map((issue, index) => (
                  <li
                    key={`${issue.kind}-${index}`}
                    className="rounded-lg bg-list px-3 py-2"
                  >
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-list-deep px-1.5 py-0.5 text-[11px] font-semibold text-list-ink">
                        {PORTFOLIO_LABELS[issue.kind]}
                      </span>
                      <span className="font-semibold text-ink">{issue.title}</span>
                      {issue.saving > 0 && (
                        <strong className="text-list-ink">{won(issue.saving)}</strong>
                      )}
                    </p>
                    <p className="mt-1 text-ink-soft">{issue.reason}</p>
                    <p className="mt-0.5 text-ink">{issue.action}</p>
                  </li>
                ))}
              </ul>
            )}
          </Step>

          {/* ⑥ 습관 유형 */}
          <Step
            number="⑥"
            title="습관 유형을 정했습니다"
            note="위에서부터 차례로 확인해서 처음 걸리는 유형으로 정합니다. '한 번도 안 쓴 구독'이 다른 어떤 신호보다 강한 낭비 신호라고 보아 맨 위에 두었습니다."
          >
            <p className="mb-3 text-sm text-ink-soft">
              지금 내 상태 — 구독 {habit.facts.total}개, 한 번도 안 쓴 구독{" "}
              {habit.facts.unusedCount}개, 손볼 구독 {habit.facts.fixableCount}개,
              자주 쓰는 구독 {habit.facts.heavyCount}개
            </p>
            <ul className="space-y-2 text-sm">
              {HABIT_RULES.map((rule) => {
                const isMatched = rule.type === habit.type;
                return (
                  <li
                    key={rule.type}
                    className={`flex flex-wrap items-baseline justify-between gap-2 rounded-lg px-3 py-2 ${
                      isMatched ? "bg-diag font-semibold" : "bg-page"
                    }`}
                  >
                    <span className={isMatched ? "text-diag-ink" : "text-ink-soft"}>
                      {rule.type}
                      {isMatched && " ← 여기"}
                    </span>
                    <span className="text-ink-soft">{rule.criteria}</span>
                  </li>
                );
              })}
            </ul>
          </Step>
        </>
      )}
    </main>
  );
}

function Step({
  number,
  title,
  note,
  children,
}: {
  number: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-ink">
        <span className="text-diag-ink">{number}</span> {title}
      </h2>
      <p className="mt-1 mb-4 text-xs leading-relaxed text-ink-soft">{note}</p>
      {children}
    </section>
  );
}
