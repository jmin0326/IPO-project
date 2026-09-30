"use client";

import Link from "next/link";
import SuggestionBadge from "@/components/SuggestionBadge";
import { INTENSITY_LABELS, type SubscriptionStat } from "@/lib/analyze";
import { won } from "@/lib/format";

type Props = {
  rank: number;
  stat: SubscriptionStat;
  /** 오늘 이미 '이용함'으로 기록했는지 */
  usedToday: boolean;
  onToggleToday: () => void;
};

/** 구독 목록 한 칸 (계획서 스케치 오른쪽의 살구색 카드) */
export default function SubscriptionCard({
  rank,
  stat,
  usedToday,
  onToggleToday,
}: Props) {
  const { subscription, name, planName, color, usageCount, costPerUse, primary } = stat;

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-list p-5 shadow-sm">
      {/* 카드 본문을 누르면 이 구독의 상세 화면으로 간다. */}
      <Link
        href={`/subscriptions/${subscription.id}`}
        className="min-w-0 flex-1 rounded-lg transition hover:opacity-70"
      >
        <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
          <span className="text-list-ink">{rank}위.</span>
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          {name}
          <span className="text-xs font-normal text-ink-soft">{planName}</span>
          <SuggestionBadge kind={primary.kind} />
          <span className="text-list-ink">›</span>
        </p>

        <p className="mt-1 text-sm text-ink-soft">
          {won(subscription.monthlyPrice)} · 매월 {subscription.billingDay}일 결제 · 월{" "}
          {usageCount}회 ({INTENSITY_LABELS[stat.intensity]})
          {stat.countSource === "manual" && (
            <span className="ml-1 text-xs">· 몰아 입력</span>
          )}
        </p>

        <p className="mt-1 text-sm text-ink">
          {primary.title}
          {primary.saving > 0 && (
            <strong className="ml-1 text-list-ink">
              매달 {won(primary.saving)} 절약
            </strong>
          )}
          {primary.saving < 0 && (
            <span className="ml-1 text-ink-soft">
              매달 {won(-primary.saving)} 추가
            </span>
          )}
        </p>

        <p className="mt-0.5 text-xs text-ink-soft">
          {costPerUse === null
            ? "이번 달 이용 기록 없음"
            : `1회당 ${won(costPerUse)}`}
          {stat.averageMinutes !== null && ` · 한 번에 평균 ${stat.averageMinutes}분`}
        </p>
      </Link>

      <button
        type="button"
        onClick={onToggleToday}
        title={usedToday ? "오늘 기록을 지웁니다" : "오늘 이용한 것으로 기록합니다"}
        className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition ${
          usedToday
            ? "bg-white text-ink-soft"
            : "bg-diag text-diag-ink hover:bg-diag-deep"
        }`}
      >
        {usedToday ? "오늘 기록됨 ✓" : "이용함"}
      </button>
    </li>
  );
}
