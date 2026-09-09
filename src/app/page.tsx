// 메인 화면 (차시 2)
//
// 계획서 3번 스케치의 첫 번째 화면을 그대로 옮긴 것이다.
// 왼쪽에 진단 카드, 오른쪽에 해지 우선순위 목록.
// 지금은 임시 데이터(MOCK_SUBSCRIPTIONS)로 배치만 확인하는 단계라
// 버튼은 아직 아무 동작도 하지 않는다.

import DiagnosisCard from "@/components/DiagnosisCard";
import SubscriptionCard from "@/components/SubscriptionCard";
import { MOCK_SUBSCRIPTIONS } from "@/data/mockSubscriptions";
import { findService } from "@/data/services";
import {
  costPerUse,
  maxSaving,
  sortByCancelPriority,
  totalMonthlyCost,
} from "@/lib/analyze";

export default function Home() {
  const subscriptions = MOCK_SUBSCRIPTIONS;
  const ranked = sortByCancelPriority(subscriptions);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10">
      <h1 className="text-2xl font-bold text-ink">구독 습관 진단기</h1>
      <p className="mt-1 text-sm text-ink-soft">
        얼마나 쓰는지 기록하면, 끊어도 될 구독을 골라 드립니다.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:items-start">
        {/* 왼쪽: 진단 결과 + 월 단위 몰아 입력 버튼 */}
        <div className="space-y-4">
          <DiagnosisCard
            // 습관 유형과 한 줄 진단은 차시 5에서 이용 기록으로 판정한다.
            habitType="방치형"
            oneLineDiagnosis="결제는 하지만 손은 잘 안 가요"
            totalCost={totalMonthlyCost(subscriptions)}
            saving={maxSaving(subscriptions)}
          />

          {/* 차시 4에서 '이번 달 이용 횟수 입력' 화면과 연결한다. */}
          <button
            type="button"
            className="w-full rounded-2xl bg-diag-deep px-5 py-4 font-semibold text-diag-ink shadow-sm"
          >
            이번 달 이용 횟수 입력
          </button>
        </div>

        {/* 오른쪽: 해지 우선순위 목록 */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold text-ink">해지 우선순위</h2>
            <p className="text-xs text-ink-soft">1회당 비용이 비싼 순서</p>
          </div>

          <ul className="space-y-3">
            {ranked.map((subscription, index) => (
              <SubscriptionCard
                key={subscription.id}
                rank={index + 1}
                serviceName={
                  findService(subscription.serviceId)?.name ??
                  subscription.serviceId
                }
                monthlyPrice={subscription.monthlyPrice}
                usageCount={subscription.usageCount}
                costPerUse={costPerUse(subscription)}
              />
            ))}
          </ul>

          {/* 차시 3에서 구독 등록 폼과 연결한다. */}
          <button
            type="button"
            className="w-full rounded-2xl border-2 border-dashed border-list-deep px-5 py-4 font-semibold text-list-ink"
          >
            + 구독 추가
          </button>
        </div>
      </div>

      <p className="mt-10 text-xs text-ink-soft">
        ※ 차시 2 단계입니다. 화면 배치까지만 만들었고, 버튼 동작은 차시 3~4에서
        연결합니다.
      </p>
    </main>
  );
}
