"use client";

// 구독 상세 화면 (계획서 스케치 4번 화면을 넓힌 것).
//
//  - 이 구독 하나에 대한 진단 (이용 강도, 1회당 비용)
//  - 요일별 이용 패턴
//  - 추천 (해지 / 요금제 낮추기 / 올리기 / 갈아타기) — 버튼을 누르면 실제로 적용된다
//  - 이 서비스의 요금제 사다리 전체

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import SuggestionBadge from "@/components/SuggestionBadge";
import WeekdayChart from "@/components/WeekdayChart";
import { categoryLabel, findPlan } from "@/data/services";
import {
  INTENSITY_LABELS,
  INTENSITY_LIMITS,
  buildStats,
  sortByPriority,
  weekdayCounts,
  weekdayMinutes,
  type Suggestion,
} from "@/lib/analyze";
import { formatMonthKey, monthKeyOf } from "@/lib/date";
import { particle, won } from "@/lib/format";
import {
  changeSubscriptionPlan,
  changeSubscriptionService,
  removeSubscription,
  useAppData,
} from "@/lib/store";
import { useToday } from "@/lib/today";
import { useIsClient } from "@/lib/useIsClient";

export default function SubscriptionDetailPage() {
  const isClient = useIsClient();
  const data = useAppData();
  const today = useToday();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (!isClient) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-10">
        <p className="text-sm text-ink-soft">불러오는 중…</p>
      </main>
    );
  }

  const month = monthKeyOf(today);
  const ranked = sortByPriority(buildStats(data, month));

  const index = ranked.findIndex((item) => item.subscription.id === params.id);
  const stat = index >= 0 ? ranked[index] : undefined;

  if (!stat) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-10">
        <Link href="/" className="text-sm text-ink-soft">
          ‹ 돌아가기
        </Link>
        <p className="mt-6 rounded-2xl bg-white p-6 text-sm text-ink-soft shadow-sm">
          이 구독을 찾을 수 없습니다. 목록에서 지워졌을 수 있습니다.
        </p>
      </main>
    );
  }

  const { subscription, name, planName, color, service, plan, usageCount } = stat;

  const minutesByWeekday = weekdayMinutes(data, subscription.id);
  const hasMinutes = minutesByWeekday.some((value) => value > 0);
  const chartValues = hasMinutes
    ? minutesByWeekday
    : weekdayCounts(data, subscription.id);

  function applySuggestion(suggestion: Suggestion) {
    if (!suggestion.targetServiceId || !suggestion.targetPlanId) return;

    const target = findPlan(suggestion.targetServiceId, suggestion.targetPlanId);
    if (!target) return;

    if (suggestion.targetServiceId === subscription.serviceId) {
      changeSubscriptionPlan(subscription.id, target.id, target.price);
    } else {
      changeSubscriptionService(
        subscription.id,
        suggestion.targetServiceId,
        target.id,
        target.price,
      );
    }
    router.push("/");
  }

  function handleCancel() {
    removeSubscription(subscription.id);
    router.push("/");
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <Link href="/" className="text-sm text-ink-soft">
        ‹ 돌아가기
      </Link>

      <h1 className="mt-3 flex flex-wrap items-center gap-2 text-2xl font-bold text-ink">
        <span className="size-3 rounded-full" style={{ backgroundColor: color }} />
        {name}
        <span className="text-base font-normal text-ink-soft">{planName}</span>
      </h1>
      {service && (
        <p className="mt-1 text-sm text-ink-soft">
          {categoryLabel(service.category)}
        </p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2 md:items-start">
        {/* 이 구독 하나에 대한 진단 */}
        <section className="rounded-2xl bg-diag p-6 shadow-sm">
          <p className="text-2xl font-bold text-ink">
            {INTENSITY_LABELS[stat.intensity]}
          </p>
          <p className="mt-1 font-semibold text-diag-ink">
            손볼 순위 {index + 1}번째
          </p>

          <dl className="mt-4 space-y-1 text-sm text-ink-soft">
            <div className="flex justify-between">
              <dt>월 요금</dt>
              <dd className="text-ink">{won(subscription.monthlyPrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{formatMonthKey(month)} 이용</dt>
              <dd className="text-ink">{usageCount}회</dd>
            </div>
            {stat.costPerUse !== null && (
              <div className="flex justify-between">
                <dt>1회당</dt>
                <dd className="text-ink">{won(stat.costPerUse)}</dd>
              </div>
            )}
            {stat.averageMinutes !== null && (
              <div className="flex justify-between">
                <dt>한 번에 평균</dt>
                <dd className="text-ink">{stat.averageMinutes}분</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>결제일</dt>
              <dd className="text-ink">매월 {subscription.billingDay}일</dd>
            </div>
          </dl>

          {service && (
            <p className="mt-4 rounded-lg bg-white px-3 py-2 text-xs leading-relaxed text-ink-soft">
              {categoryLabel(service.category)}는 한 달{" "}
              {INTENSITY_LIMITS[service.category].low + 1}~
              {INTENSITY_LIMITS[service.category].medium}번이면 &lsquo;적당히&rsquo;,{" "}
              {INTENSITY_LIMITS[service.category].medium + 1}번부터
              &lsquo;자주&rsquo;로 봅니다. {INTENSITY_LIMITS[service.category].note}.
            </p>
          )}
        </section>

        {/* 요일별 이용 패턴 */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-ink">
            요일별 이용 {hasMinutes ? "시간" : "횟수"}
          </h2>
          <p className="mt-1 mb-3 text-xs text-ink-soft">
            지금까지 남긴 기록 전체 기준입니다.
            {!hasMinutes && " 이용 시간을 적으면 시간으로 바뀝니다."}
          </p>
          <WeekdayChart
            values={chartValues}
            unit={hasMinutes ? "minutes" : "count"}
          />
        </section>
      </div>

      {/* 추천 */}
      <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-ink">추천</h2>
        <p className="mt-1 mb-4 text-xs leading-relaxed text-ink-soft">
          이용 강도에 맞춰 고른 것입니다. 버튼을 누르면 바로 적용되고, 지금까지 쌓인
          이용 기록은 그대로 남습니다.
        </p>

        <ul className="space-y-3">
          {stat.suggestions.map((suggestion, order) => (
            <li
              key={`${suggestion.kind}-${suggestion.targetPlanId ?? order}`}
              className={`rounded-xl p-4 ${
                order === 0 ? "bg-diag" : "bg-page"
              }`}
            >
              <p className="flex flex-wrap items-center gap-2">
                <SuggestionBadge kind={suggestion.kind} />
                <span className="font-semibold text-ink">{suggestion.title}</span>
                {suggestion.saving > 0 && (
                  <strong className="text-list-ink">
                    매달 {won(suggestion.saving)} 절약
                  </strong>
                )}
                {suggestion.saving < 0 && (
                  <span className="text-ink-soft">
                    매달 {won(-suggestion.saving)} 더 냄
                  </span>
                )}
              </p>

              <p className="mt-2 text-sm text-ink-soft">{suggestion.reason}</p>
              {suggestion.tradeoff && (
                <p className="mt-1 text-sm text-list-ink">
                  감안할 점: {suggestion.tradeoff}
                </p>
              )}

              {suggestion.targetPlanId && (
                <button
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="mt-3 rounded-lg bg-diag-deep px-4 py-2 text-sm font-semibold text-diag-ink"
                >
                  이대로 바꾸기
                </button>
              )}

              {suggestion.kind === "cancel" && (
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(true)}
                  className="mt-3 rounded-lg bg-list-deep px-4 py-2 text-sm font-semibold text-list-ink"
                >
                  해지하기
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* 이 서비스의 요금제 전체 */}
      {service && service.plans.length > 1 && (
        <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-ink">{name}의 요금제</h2>
          <p className="mt-1 mb-4 text-xs text-ink-soft">
            지금 쓰는 요금제는 파란 줄입니다.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-md text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-ink-soft">
                  <th className="py-2 font-medium">요금제</th>
                  <th className="py-2 text-right font-medium">월 요금</th>
                  <th className="py-2 text-center font-medium">광고</th>
                  <th className="py-2 font-medium">화질·음질</th>
                  <th className="py-2 text-center font-medium">동시</th>
                </tr>
              </thead>
              <tbody>
                {service.plans.map((item) => {
                  const isCurrent = item.id === plan?.id;
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-zinc-100 ${
                        isCurrent ? "bg-diag font-semibold" : ""
                      }`}
                    >
                      <td className="py-2 text-ink">
                        {item.name}
                        {isCurrent && (
                          <span className="ml-1 text-xs text-diag-ink">지금</span>
                        )}
                      </td>
                      <td className="py-2 text-right text-ink">{won(item.price)}</td>
                      <td className="py-2 text-center text-ink-soft">
                        {item.ads ? "있음" : "없음"}
                      </td>
                      <td className="py-2 text-ink-soft">{item.quality ?? "—"}</td>
                      <td className="py-2 text-center text-ink-soft">
                        {item.devices ? `${item.devices}대` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 결정 버튼 */}
      <div className="mt-5">
        {confirmingCancel ? (
          <div className="rounded-xl bg-list p-4 text-center">
            <p className="text-sm text-list-ink">
              정말 목록에서 지울까요? {name} 이용 기록도 같이 지워집니다.
            </p>
            <div className="mt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg bg-list-deep px-4 py-2 text-sm font-semibold text-list-ink"
              >
                네, 해지합니다
              </button>
              <button
                type="button"
                onClick={() => setConfirmingCancel(false)}
                className="rounded-lg px-4 py-2 text-sm text-ink-soft"
              >
                아니요
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setConfirmingCancel(true)}
              className="rounded-xl bg-list px-5 py-3 font-semibold text-list-ink"
            >
              해지하기
            </button>
            <Link
              href="/"
              className="rounded-xl bg-page px-5 py-3 text-center font-semibold text-ink-soft"
            >
              그대로 두고 나가기
            </Link>
          </div>
        )}
      </div>

      {service?.reachNote && (
        <p className="mt-4 text-xs text-ink-soft">
          ※ {name}
          {particle(name, "은", "는")} {service.reachNote}. 갈아타기 추천은 이
          숫자를 근거로 합니다.
        </p>
      )}
    </main>
  );
}
