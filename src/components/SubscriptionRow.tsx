"use client";

// '내 구독' 목록의 한 줄.
//
// 예전 카드에는 숫자가 7개(요금·결제일·횟수·강도·절약액·1회당·평균 분) 있었다.
// 한눈에 들어오라고 만든 목록인데 오히려 읽는 데 시간이 걸렸다.
// 그래서 이름·요금·상태만 남기고 나머지는 상세 화면으로 옮겼다.

import Link from "next/link";
import ServiceTile from "@/components/ServiceTile";
import SuggestionBadge from "@/components/SuggestionBadge";
import { INTENSITY_LABELS, type SubscriptionStat } from "@/lib/analyze";
import { won } from "@/lib/format";

type Props = {
  stat: SubscriptionStat;
  /** 오늘 이미 '이용함'으로 기록했는지 */
  usedToday: boolean;
  onToggleToday: () => void;
};

export default function SubscriptionRow({ stat, usedToday, onToggleToday }: Props) {
  const { subscription, name, planName, usageCount, primary } = stat;

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <Link
        href={`/subscriptions/${subscription.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 transition hover:opacity-70"
      >
        <ServiceTile serviceId={subscription.serviceId} />

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-ink">{name}</span>
            <SuggestionBadge kind={primary.kind} />
          </span>
          <span className="mt-0.5 block truncate text-xs text-ink-soft">
            {planName} · 월 {usageCount}회 ({INTENSITY_LABELS[stat.intensity]})
          </span>
        </span>

        <span className="shrink-0 text-right">
          <span className="block font-semibold text-ink">
            {won(subscription.monthlyPrice)}
          </span>
          <span className="block text-xs text-ink-soft">
            {stat.costPerUse === null ? "미사용" : `1회 ${won(stat.costPerUse)}`}
          </span>
        </span>
      </Link>

      <button
        type="button"
        onClick={onToggleToday}
        title={usedToday ? "오늘 기록을 지웁니다" : "오늘 이용한 것으로 기록합니다"}
        className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${
          usedToday
            ? "bg-page text-ink-soft"
            : "bg-diag text-diag-ink hover:bg-diag-deep"
        }`}
      >
        {usedToday ? "기록됨 ✓" : "이용함"}
      </button>
    </li>
  );
}
