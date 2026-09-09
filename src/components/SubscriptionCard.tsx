import { won } from "@/lib/format";

type Props = {
  rank: number;
  serviceName: string;
  monthlyPrice: number;
  usageCount: number;
  /** 1회당 비용. 이번 달 이용 기록이 없으면 null */
  costPerUse: number | null;
};

/** 구독 목록 한 칸 (계획서 스케치 오른쪽의 살구색 카드) */
export default function SubscriptionCard({
  rank,
  serviceName,
  monthlyPrice,
  usageCount,
  costPerUse,
}: Props) {
  return (
    <li className="flex items-center gap-4 rounded-2xl bg-list p-5 shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">
          <span className="text-list-ink">{rank}위.</span> {serviceName}
        </p>

        <p className="mt-1 text-sm text-ink-soft">
          {won(monthlyPrice)} · 월 {usageCount}회 ·{" "}
          {costPerUse === null ? (
            <span className="font-semibold text-list-ink">
              이번 달 이용 기록 없음
            </span>
          ) : (
            <>1회당 {won(costPerUse)}</>
          )}
        </p>
      </div>

      {/* 차시 4에서 이용 기록 입력과 연결한다. */}
      <button
        type="button"
        className="shrink-0 rounded-lg bg-diag px-4 py-2 text-sm font-semibold text-diag-ink"
      >
        입력
      </button>
    </li>
  );
}
