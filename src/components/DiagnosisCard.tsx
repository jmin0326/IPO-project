import { won } from "@/lib/format";

type Props = {
  habitType: string;
  oneLineDiagnosis: string;
  totalCost: number;
  saving: number;
};

/** 메인 화면 왼쪽의 하늘색 진단 카드 (계획서 스케치 왼쪽 위) */
export default function DiagnosisCard({
  habitType,
  oneLineDiagnosis,
  totalCost,
  saving,
}: Props) {
  return (
    <section className="rounded-2xl bg-diag p-6 shadow-sm">
      <p className="text-sm text-diag-ink/70">이번 달 진단</p>

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
          <dt className="text-sm text-ink-soft">절약 예상 최대</dt>
          <dd className="text-xl font-semibold text-diag-ink">
            −{won(saving)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
