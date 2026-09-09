// 처리(Process) 단계 계산.
//
// 차시 2에서는 화면을 채우는 데 필요한 최소한만 만들어 둔다.
// 습관 유형 판정과 대체 서비스 추천은 차시 5에서 여기에 이어서 붙인다.

import type { Subscription } from "./types";

/**
 * 1회당 실제 비용 = 월 요금 ÷ 이번 달 이용 횟수
 *
 * 이용 횟수가 0이면 나눗셈이 안 된다(0으로 나누기).
 * 무한대나 NaN을 그대로 화면에 흘리면 "1회당 Infinity원"이 뜨므로,
 * 여기서는 null을 돌려주고 화면에서 "이번 달 이용 기록 없음"으로 표시한다.
 *
 * → 0회를 '아주 비싼 값'으로 볼지 '계산 불가'로 볼지는 차시 5에서 다시 정한다.
 *   지금 정한 근거: 0회는 계산이 안 되는 게 아니라 "한 번도 안 썼다"는 가장 강한
 *   해지 신호이므로, 숫자를 억지로 만들기보다 따로 표시하는 편이 정직하다.
 */
export function costPerUse(subscription: Subscription): number | null {
  if (subscription.usageCount <= 0) return null;
  return subscription.monthlyPrice / subscription.usageCount;
}

/**
 * 해지 우선순위 순으로 정렬한다. (1회당 비용이 비싼 것부터)
 *
 * 이번 달에 한 번도 안 쓴 구독(costPerUse가 null)을 맨 위로 올린다.
 * 계획서 2번의 "이 값이 기준보다 높거나 최근 이용이 없는 구독" 중
 * 뒤쪽 조건에 해당하는 경우라, 가장 먼저 보여 주는 게 맞다고 판단했다.
 */
export function sortByCancelPriority(subscriptions: Subscription[]): Subscription[] {
  return [...subscriptions].sort((a, b) => {
    const costA = costPerUse(a);
    const costB = costPerUse(b);

    if (costA === null && costB === null) return b.monthlyPrice - a.monthlyPrice;
    if (costA === null) return -1;
    if (costB === null) return 1;
    return costB - costA;
  });
}

/** 매달 빠져나가는 구독료 총액 */
export function totalMonthlyCost(subscriptions: Subscription[]): number {
  return subscriptions.reduce((sum, subscription) => sum + subscription.monthlyPrice, 0);
}

/**
 * 절약 예상 최대액.
 *
 * 차시 2 기준: 해지 우선순위 1위 하나를 끊었을 때 아끼는 금액.
 * 차시 5에서 "1회당 비용이 기준보다 높은 구독 전부"로 바꿀 예정이다.
 */
export function maxSaving(subscriptions: Subscription[]): number {
  const top = sortByCancelPriority(subscriptions)[0];
  return top ? top.monthlyPrice : 0;
}
