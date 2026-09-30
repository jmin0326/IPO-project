// 구독 전체를 함께 봤을 때 나오는 문제들 (중복 · 묶음 · 몰림).
//
// 구독을 하나씩 따로만 보면 절대 안 보이는 것들이라 목록과 따로 떼어 놓았다.
// 예: 쿠팡 와우를 쓰면서 쿠팡플레이를 따로 결제하는 경우.

import { PORTFOLIO_LABELS, type PortfolioIssue } from "@/lib/analyze";
import { won } from "@/lib/format";

export default function PortfolioNotices({ issues }: { issues: PortfolioIssue[] }) {
  if (issues.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold text-ink">전체 점검</h2>
        <p className="text-xs text-ink-soft">구독을 묶어서 봤을 때 보이는 것</p>
      </div>

      <ul className="space-y-3">
        {issues.map((issue, index) => (
          <li
            key={`${issue.kind}-${index}`}
            className="rounded-2xl border-2 border-list-deep bg-white p-5 shadow-sm"
          >
            <p className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-list-deep px-1.5 py-0.5 text-[11px] font-semibold text-list-ink">
                {PORTFOLIO_LABELS[issue.kind]}
              </span>
              <span className="font-semibold text-ink">{issue.title}</span>
              {issue.saving > 0 && (
                <strong className="text-list-ink">
                  매달 {won(issue.saving)} 절약
                </strong>
              )}
            </p>

            <p className="mt-2 text-sm text-ink-soft">{issue.reason}</p>
            <p className="mt-1 text-sm text-ink">{issue.action}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
