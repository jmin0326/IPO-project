"use client";

// 메인 화면.
//
// "한 번에 보기 복잡하다"는 피드백을 받고 세 가지를 바꿨다.
//
// 1. 좌우 2단 -> 세로 1단.
//    예전에는 왼쪽에 진단+달력, 오른쪽에 점검+추천이라 눈이 좌우를 오갔다.
//    이제 위에서 아래로 '결론 -> 할 일 -> 내 구독' 순서로 읽힌다.
//
// 2. 달력을 /calendar 로 뺐다.
//    달력은 진단 결과가 아니라 기록하는 도구다. 메인에서 제일 긴 덩어리였다.
//
// 3. '전체 점검'과 '구독별 추천'을 '이번 달 할 일' 하나로 합쳤다.
//    둘 다 추천인데 따로 있어서 관계가 안 보였다.
//    buildActionPlan() 이 이미 둘을 합쳐 주고 있었는데 화면만 따로였다.

import { useState } from "react";
import Link from "next/link";
import ActionList from "@/components/ActionList";
import BillingSoon from "@/components/BillingSoon";
import DiagnosisCard from "@/components/DiagnosisCard";
import SubscriptionRow from "@/components/SubscriptionRow";
import {
  buildActionPlan,
  buildStats,
  judgeHabit,
  sortByPriority,
  totalMonthlyCost,
} from "@/lib/analyze";
import { serviceName } from "@/data/services";
import { won } from "@/lib/format";
import {
  clearAll,
  loadSampleData,
  resumeSubscription,
  toggleUsageLog,
  useAppData,
} from "@/lib/store";
import { useToday } from "@/lib/today";
import { useIsClient } from "@/lib/useIsClient";

export default function Home() {
  const isClient = useIsClient();
  const data = useAppData();
  const today = useToday();
  // 샘플 넣기와 전부 지우기는 둘 다 지금 데이터를 날리므로 한 번 더 물어본다.
  const [pending, setPending] = useState<"sample" | "clear" | null>(null);

  if (!isClient) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-10">
        <h1 className="text-2xl font-bold text-ink">구독 습관 진단기</h1>
        <p className="mt-6 text-sm text-ink-soft">불러오는 중…</p>
      </main>
    );
  }

  const stats = buildStats(data, today);
  const ranked = sortByPriority(stats);
  const habit = judgeHabit(stats);
  const plan = buildActionPlan(data, stats);
  const endedSubscriptions = data.subscriptions.filter(
    (item) => item.endedOn !== null,
  );
  const total = totalMonthlyCost(stats);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8">
      <h1 className="text-2xl font-bold text-ink">구독 습관 진단기</h1>
      <p className="mt-1 text-sm text-ink-soft">
        얼마나 쓰는지 기록하면, 끊을지 낮출지 바꿀지 골라 드립니다.
      </p>

      {/* 0층 — 곧 결제되는 것부터. 지나가면 되돌릴 수 없는 일이라 맨 위에 둔다. */}
      <div className="mt-6">
        <BillingSoon stats={stats} today={today} />
      </div>

      {/* 1층 — 결론 */}
      <div className="mt-4">
        <DiagnosisCard
          habitType={habit.type}
          oneLineDiagnosis={habit.oneLine}
          totalCost={total}
          saving={plan.total}
          fixCount={plan.items.filter((item) => !item.alternative).length}
        />
      </div>

      {/* 2층 — 할 일 */}
      {data.subscriptions.length > 0 && (
        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-ink">이번 달 할 일</h2>
            <Link href="/diagnosis" className="text-xs text-diag-ink">
              왜 이런 결과인지 ›
            </Link>
          </div>
          <div className="mt-3">
            <ActionList items={plan.items} compact />
          </div>
        </section>
      )}

      {/* 3층 — 내 구독 */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-ink">내 구독</h2>
          {stats.length > 0 && (
            <p className="text-xs text-ink-soft">
              {stats.length}개 · 매달 {won(total)}
            </p>
          )}
        </div>

        {ranked.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-white p-6 text-sm text-ink-soft shadow-sm">
            아직 등록한 구독이 없습니다. 아래에서 추가해 주세요.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {ranked.map((stat) => (
              <SubscriptionRow
                key={stat.subscription.id}
                stat={stat}
                usedToday={data.usageLogs.some(
                  (log) =>
                    log.subscriptionId === stat.subscription.id &&
                    log.date === today,
                )}
                onToggleToday={() => toggleUsageLog(stat.subscription.id, today)}
              />
            ))}
          </ul>
        )}

        <Link
          href="/subscriptions/new"
          className="mt-2 block w-full rounded-2xl border-2 border-dashed border-list-deep px-5 py-3 text-center text-sm font-semibold text-list-ink"
        >
          + 구독 추가
        </Link>
      </section>

      {/* 해지한 구독 — 기록은 남아 있다 */}
      {endedSubscriptions.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-ink">해지한 구독</h2>
          <p className="mt-1 text-xs text-ink-soft">
            진단에서는 빠지지만 달력의 지난 기록은 그대로 남아 있습니다.
          </p>
          <ul className="mt-3 space-y-2">
            {endedSubscriptions.map((subscription) => (
              <li
                key={subscription.id}
                className="flex flex-wrap items-center gap-2 rounded-xl bg-page px-4 py-3 text-sm"
              >
                <span className="font-semibold text-ink-soft">
                  {subscription.customName ?? serviceName(subscription.serviceId)}
                </span>
                <span className="text-xs text-ink-soft">
                  {subscription.endedOn}에 해지
                </span>
                <button
                  type="button"
                  onClick={() => resumeSubscription(subscription.id)}
                  className="ml-auto text-xs text-diag-ink underline underline-offset-2"
                >
                  다시 구독 중으로
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 기록하는 도구들 */}
      <nav className="mt-8 grid gap-2 sm:grid-cols-2">
        <Link
          href="/calendar"
          className="rounded-2xl bg-diag px-5 py-4 text-center font-semibold text-diag-ink"
        >
          달력으로 기록 보기
        </Link>
        <Link
          href="/usage"
          className="rounded-2xl bg-diag px-5 py-4 text-center font-semibold text-diag-ink"
        >
          이번 달 이용 횟수 입력
        </Link>
      </nav>

      <footer className="mt-10 space-y-2 text-xs text-ink-soft">
        <p>
          ※ 등록한 내용은 내 계정에 저장됩니다. 다른 기기에서 로그인해도 그대로
          보입니다.
        </p>

        {pending === null && (
          <p className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setPending("sample")}
              title="시연용 샘플 구독과 이용 기록을 이 계정에 넣습니다"
              className="underline underline-offset-2"
            >
              샘플 데이터 넣기
            </button>
            <button
              type="button"
              onClick={() => setPending("clear")}
              title="이 계정의 구독과 이용 기록을 전부 지웁니다"
              className="underline underline-offset-2"
            >
              전부 지우기
            </button>
          </p>
        )}

        {pending !== null && (
          <p className="flex flex-wrap items-center gap-2 rounded-lg bg-list px-3 py-1.5">
            <span className="text-list-ink">
              {pending === "sample"
                ? "지금 등록된 구독을 모두 지우고 샘플로 바꿉니다."
                : "등록한 구독과 이용 기록이 전부 지워집니다."}{" "}
              되돌릴 수 없습니다.
            </span>
            <button
              type="button"
              onClick={() => {
                setPending(null);
                void (pending === "sample" ? loadSampleData() : clearAll());
              }}
              className="rounded bg-list-deep px-2 py-1 font-semibold text-list-ink"
            >
              {pending === "sample" ? "네, 샘플로 바꿉니다" : "네, 전부 지웁니다"}
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="underline underline-offset-2"
            >
              아니요
            </button>
          </p>
        )}
      </footer>
    </main>
  );
}
