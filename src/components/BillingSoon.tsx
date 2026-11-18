"use client";

// 결제일이 곧 돌아오는 구독을 미리 알려 주는 띠.
//
// 받은 피드백: "결제일 며칠 전에 알림을 보내주면 해지할지 고민할 시간이 생겨서
// 불필요한 결제를 막을 수 있을 것 같아요."
//
// 다만 휴대폰 푸시 알림은 이 앱이 보낼 수 없다. 웹앱이라 앱을 닫아 두면
// 알려 줄 방법이 없고, 그러려면 서버가 때맞춰 보내 주는 장치가 따로 필요하다.
// 그래서 할 수 있는 선에서 — **앱을 열었을 때 맨 위에 먼저 보이게** 했다.
// 결제 전에 한 번이라도 앱을 열면 눈에 띈다.

import Link from "next/link";
import ServiceTile from "@/components/ServiceTile";
import type { SubscriptionStat } from "@/lib/analyze";
import { billingDayInMonth, daysInMonth, monthKeyOf } from "@/lib/date";
import { won } from "@/lib/format";

/** 며칠 앞까지 미리 알려 줄지. 고민할 시간을 주려면 2~3일은 있어야 한다. */
const NOTICE_DAYS = 3;

type Props = {
  stats: SubscriptionStat[];
  /** "YYYY-MM-DD" */
  today: string;
};

/** 오늘부터 결제일까지 며칠 남았는지. 이미 지났으면 다음 달로 센다. */
function daysUntilBilling(billingDay: number, today: string): number {
  const month = monthKeyOf(today);
  const todayDay = Number(today.slice(8, 10));
  const thisMonthBilling = billingDayInMonth(billingDay, month);

  if (thisMonthBilling >= todayDay) return thisMonthBilling - todayDay;

  // 이번 달 결제일은 지났으니 다음 달 결제일까지
  const left = daysInMonth(month) - todayDay;
  return left + Math.min(billingDay, 28);
}

export default function BillingSoon({ stats, today }: Props) {
  const soon = stats
    .map((stat) => ({
      stat,
      days: daysUntilBilling(stat.subscription.billingDay, today),
    }))
    .filter((item) => item.days <= NOTICE_DAYS)
    .sort((a, b) => a.days - b.days);

  if (soon.length === 0) return null;

  const total = soon.reduce(
    (sum, item) => sum + item.stat.subscription.monthlyPrice,
    0,
  );

  return (
    <section className="rounded-2xl border-2 border-list-deep bg-list p-5">
      <p className="font-bold text-list-ink">
        곧 결제됩니다 — {soon.length}건 {won(total)}
      </p>
      <p className="mt-1 text-xs text-list-ink">
        정리할 생각이 있다면 결제되기 전에 하는 편이 이번 달부터 바로 아낍니다.
      </p>

      <ul className="mt-3 space-y-2">
        {soon.map(({ stat, days }) => (
          <li key={stat.subscription.id}>
            <Link
              href={`/subscriptions/${stat.subscription.id}`}
              className="flex items-center gap-3 rounded-xl bg-white p-3 transition hover:opacity-70"
            >
              <ServiceTile serviceId={stat.subscription.serviceId} size="sm" />

              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">
                  {stat.name}
                </span>
                <span className="block text-xs text-ink-soft">
                  {days === 0 ? "오늘" : `${days}일 뒤`} ·{" "}
                  {stat.primary.kind === "keep"
                    ? "잘 쓰고 있습니다"
                    : stat.primary.title}
                </span>
              </span>

              <span className="shrink-0 font-semibold text-ink">
                {won(stat.subscription.monthlyPrice)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
