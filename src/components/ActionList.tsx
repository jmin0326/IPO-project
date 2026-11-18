"use client";

// '이번 달 할 일' 목록.
//
// 예전에는 메인 화면이 '전체 점검'과 '구독별 추천'을 따로 보여 줬다.
// 둘 다 추천인데 제목이 달라서 무슨 관계인지 안 보였고, 13,500원짜리 추천과
// '그대로 두기'가 같은 크기로 나란히 있었다.
//
// 이제 buildActionPlan() 이 둘을 한 줄로 세워 주므로 화면도 하나로 합쳤다.
// 메인은 compact 로 짧게, 진단 화면은 자세히 — 같은 컴포넌트를 쓴다.

import Link from "next/link";
import { won } from "@/lib/format";
import type { ActionItem } from "@/lib/analyze";

type Props = {
  items: ActionItem[];
  /** 메인 화면처럼 짧게 보여 줄지 */
  compact?: boolean;
};

export default function ActionList({ items, compact = false }: Props) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-6 text-sm text-ink-soft shadow-sm">
        손볼 것이 없습니다. 지금 구성이 괜찮다는 뜻입니다.
      </p>
    );
  }

  // 번호는 '또 다른 방법'을 빼고 센다.
  // 그리는 도중에 숫자를 올리면 다시 그릴 때 값이 달라질 수 있어서,
  // 앞에 몇 개가 있었는지를 세서 구한다.
  const numbered = items.map((item, index) => ({
    item,
    step: items.filter(
      (other, otherIndex) => otherIndex <= index && !other.alternative,
    ).length,
  }));

  return (
    <ul className="space-y-2">
      {numbered.map(({ item, step }) => (
        <li
          key={item.key}
          className={`rounded-2xl shadow-sm ${
            item.alternative ? "ml-6 bg-page p-4" : "bg-white p-5"
          }`}
        >
          <div className="flex gap-3">
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
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

              <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="rounded bg-page px-1.5 py-0.5 text-[11px] font-semibold text-ink-soft">
                  {item.badge}
                </span>
                <span className="font-semibold text-ink">{item.title}</span>
                {item.saving > 0 && (
                  <strong className="text-list-ink">
                    매달 {won(item.saving)}
                  </strong>
                )}
              </p>

              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                {item.why}
              </p>

              {/* 왜 그런지는 메인에서는 생략하고 자세히 보기에서만 보여 준다. */}
              {!compact && item.more && (
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {item.more}
                </p>
              )}

              {!compact && item.caution && (
                <p className="mt-2 rounded-lg bg-list px-3 py-2 text-sm text-list-ink">
                  {item.cautionIsTradeoff ? "대신 포기해야 합니다 — " : "참고 — "}
                  {item.caution}
                </p>
              )}

              {item.subscriptionId && (
                <Link
                  href={`/subscriptions/${item.subscriptionId}`}
                  className="mt-1.5 inline-block text-sm font-semibold text-diag-ink"
                >
                  여기서 바로 바꾸기 ›
                </Link>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
