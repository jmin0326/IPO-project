import Link from "next/link";
import { won } from "@/lib/format";

type Props = {
  habitType: string;
  oneLineDiagnosis: string;
  totalCost: number;
  saving: number;
  /** 손볼 구독 개수 */
  fixCount: number;
};

/**
 * 메인 화면 왼쪽의 하늘색 진단 카드.
 *
 * 카드 전체가 링크라서 누르면 상세 진단 화면으로 넘어간다.
 * 여기서는 결론만 보여 주고, 그 숫자가 어떻게 나왔는지는 /diagnosis 에서 설명한다.
 */
export default function DiagnosisCard({
  habitType,
  oneLineDiagnosis,
  totalCost,
  saving,
  fixCount,
}: Props) {
  return (
    <Link
      href="/diagnosis"
      className="block rounded-2xl bg-diag p-6 shadow-sm transition hover:bg-diag-deep"
    >
      <p className="flex items-center justify-between text-sm text-diag-ink/70">
        이번 달 진단
        <span className="font-semibold text-diag-ink">자세히 보기 ›</span>
      </p>

      <p className="mt-2 text-2xl font-bold text-ink">
        당신은 <span className="text-diag-ink">&ldquo;{habitType}&rdquo;</span>
      </p>
      <p className="mt-1 text-base text-ink-soft">{oneLineDiagnosis}</p>

      <dl className="mt-6 space-y-3 border-t border-diag-deep pt-5">
        <div className="flex items-baseline justify-between">
          <dt className="text-sm text-ink-soft">총 구독료</dt>
          <dd className="text-xl font-semibold text-ink">{won(totalCost)}</dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-sm text-ink-soft">
            절약 예상 최대
            {fixCount > 0 && (
              <span className="ml-1 text-xs">(손볼 구독 {fixCount}개)</span>
            )}
          </dt>
          <dd className="text-xl font-semibold text-diag-ink">
            {saving > 0 ? `−${won(saving)}` : won(0)}
          </dd>
        </div>
      </dl>
    </Link>
  );
}
