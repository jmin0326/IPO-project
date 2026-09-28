"use client";

// 상세 진단 화면.
//
// 메인 화면은 "방치형", "−11,900원" 같은 결론만 보여 준다.
// 이 화면은 그 숫자가 어떤 순서로 나왔는지를 ①~⑤로 나눠서 보여 준다.
// 계획서 IPO 구조에서 가려져 있던 '처리(Process)' 부분을 눈에 보이게 만든 화면이다.

import Link from "next/link";
import {
  COST_PER_USE_LIMIT,
  HABIT_RULES,
  buildStats,
  cancelCandidates,
  judgeHabit,
  sortByCancelPriority,
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
  const ranked = sortByCancelPriority(stats);
  const candidates = cancelCandidates(stats);
  const habit = judgeHabit(stats);
  const total = totalMonthlyCost(stats);
  const saving = candidates.reduce(
    (sum, stat) => sum + stat.subscription.monthlyPrice,
    0,
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
          {/* 결론 */}
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
            title="이번 달 이용 횟수를 셌습니다"
            note="달력에 남긴 기록을 세되, 월 단위로 몰아서 입력한 값이 있으면 그쪽을 씁니다. 날짜는 기억 안 나도 횟수는 아는 경우가 있기 때문입니다."
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-ink-soft">
                  <th className="py-2 font-medium">서비스</th>
                  <th className="py-2 text-right font-medium">달력 기록</th>
                  <th className="py-2 text-right font-medium">몰아 입력</th>
                  <th className="py-2 text-right font-medium">쓰는 값</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat) => (
                  <tr key={stat.subscription.id} className="border-b border-zinc-100">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </Step>

          {/* ② 1회당 비용 */}
          <Step
            number="②"
            title="월 요금을 이용 횟수로 나눴습니다"
            note="같은 요금이라도 많이 쓰면 1회당 값이 싸집니다. 이 값이 '실제로 얼마를 주고 쓰고 있는가'입니다. 0회는 나눌 수 없어서 따로 표시합니다."
          >
            <ul className="space-y-2 text-sm">
              {stats.map((stat) => (
                <li
                  key={stat.subscription.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-100 pb-2"
                >
                  <span className="text-ink">{stat.name}</span>
                  <span className="font-mono text-ink-soft">
                    {won(stat.subscription.monthlyPrice)} ÷ {stat.usageCount}회 ={" "}
                    {stat.costPerUse === null ? (
                      <span className="font-sans font-semibold text-list-ink">
                        계산 불가 (0회)
                      </span>
                    ) : (
                      <strong className="font-sans text-ink">
                        {won(stat.costPerUse)}
                      </strong>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Step>

          {/* ③ 해지 후보 */}
          <Step
            number="③"
            title="해지 후보를 골랐습니다"
            note={`기준은 두 가지입니다. (1) 이번 달에 한 번도 안 썼거나, (2) 1회당 비용이 ${won(COST_PER_USE_LIMIT)} 이상이면 후보로 봅니다. ${won(COST_PER_USE_LIMIT)}은 정답이 있는 값이 아니라 제가 정한 기준선으로, 편의점 커피 한 잔 값 정도로 잡았습니다.`}
          >
            <ul className="space-y-2 text-sm">
              {ranked.map((stat, index) => (
                <li
                  key={stat.subscription.id}
                  className={`flex flex-wrap items-baseline justify-between gap-2 rounded-lg px-3 py-2 ${
                    stat.isCancelCandidate ? "bg-list" : "bg-page"
                  }`}
                >
                  <span className="text-ink">
                    <strong>{index + 1}위.</strong> {stat.name}
                  </span>
                  <span
                    className={
                      stat.isCancelCandidate ? "text-list-ink" : "text-ink-soft"
                    }
                  >
                    {stat.reason}
                  </span>
                </li>
              ))}
            </ul>
          </Step>

          {/* ④ 절약 예상액 */}
          <Step
            number="④"
            title="해지 후보 요금을 모두 더했습니다"
            note="후보를 전부 끊는 것은 가장 극단적인 선택이라, 실제로는 이보다 덜 아끼게 됩니다. 그래서 '최대'라고 적었습니다."
          >
            {candidates.length === 0 ? (
              <p className="text-sm text-ink-soft">
                해지 후보가 없습니다. 지금은 줄일 것이 없다는 뜻입니다.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {candidates.map((stat) => (
                  <li
                    key={stat.subscription.id}
                    className="flex justify-between text-ink-soft"
                  >
                    <span>{stat.name}</span>
                    <span>{won(stat.subscription.monthlyPrice)}</span>
                  </li>
                ))}
                <li className="flex justify-between border-t border-zinc-200 pt-2 font-semibold text-ink">
                  <span>절약 예상 최대</span>
                  <span>{won(saving)}</span>
                </li>
              </ul>
            )}
          </Step>

          {/* ⑤ 습관 유형 */}
          <Step
            number="⑤"
            title="습관 유형을 정했습니다"
            note="위에서부터 차례로 확인해서 처음 걸리는 유형으로 정합니다. '한 번도 안 쓴 구독'이 있다는 것이 가장 강한 낭비 신호라고 보아 맨 위에 두었습니다."
          >
            <p className="mb-3 text-sm text-ink-soft">
              지금 내 상태 — 구독 {habit.facts.total}개, 한 번도 안 쓴 구독{" "}
              {habit.facts.unusedCount}개, 해지 후보 {habit.facts.candidateCount}개
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
