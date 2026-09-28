"use client";

import { won } from "@/lib/format";
import type { SubscriptionStat } from "@/lib/analyze";

type Props = {
  rank: number;
  stat: SubscriptionStat;
  /** 오늘 이미 '이용함'으로 기록했는지 */
  usedToday: boolean;
  onToggleToday: () => void;
  onRemove: () => void;
};

/** 구독 목록 한 칸 (계획서 스케치 오른쪽의 살구색 카드) */
export default function SubscriptionCard({
  rank,
  stat,
  usedToday,
  onToggleToday,
  onRemove,
}: Props) {
  const { subscription, name, color, usageCount, costPerUse, countSource } = stat;

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-list p-5 shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-semibold text-ink">
          <span className="text-list-ink">{rank}위.</span>
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          {name}
          {stat.isCancelCandidate && (
            <span className="rounded bg-list-deep px-1.5 py-0.5 text-[11px] font-semibold text-list-ink">
              해지 후보
            </span>
          )}
        </p>

        <p className="mt-1 text-sm text-ink-soft">
          {won(subscription.monthlyPrice)} · 매월 {subscription.billingDay}일 결제 · 월{" "}
          {usageCount}회
          {countSource === "manual" && (
            <span className="ml-1 text-xs">(몰아 입력)</span>
          )}
        </p>

        <p className="mt-0.5 text-sm">
          {costPerUse === null ? (
            <span className="font-semibold text-list-ink">
              이번 달 이용 기록 없음
            </span>
          ) : (
            <span className="text-ink">1회당 {won(costPerUse)}</span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <button
          type="button"
          onClick={onToggleToday}
          title={
            usedToday ? "오늘 기록을 지웁니다" : "오늘 이용한 것으로 기록합니다"
          }
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            usedToday
              ? "bg-white text-ink-soft"
              : "bg-diag text-diag-ink hover:bg-diag-deep"
          }`}
        >
          {usedToday ? "오늘 기록됨 ✓" : "이용함"}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="px-1 text-xs text-ink-soft underline underline-offset-2"
        >
          목록에서 삭제
        </button>
      </div>
    </li>
  );
}
