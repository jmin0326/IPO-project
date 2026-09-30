// 처리(Process) 단계. 계획서 IPO의 가운데 부분.
//
// 여기서 중요한 점: 이 파일은 "답"만 돌려주지 않고 "왜 그렇게 판단했는지"도 같이 돌려준다.
// 상세 진단 화면(/diagnosis)이 그 이유를 그대로 받아서 사람이 읽을 수 있게 보여 준다.

import {
  SERVICES,
  findService,
  serviceColor,
  serviceName,
  type Service,
} from "@/data/services";
import { monthKeyOf, weekdayOf } from "./date";
import { won } from "./format";
import type { AppData, Subscription } from "./types";

/**
 * 1회 쓰는 데 이 금액을 넘으면 "비싸게 쓰고 있다"고 본다. (원)
 *
 * 왜 3,000원인가 — 정답이 있는 값이 아니라 내가 정한 기준선이다.
 * 편의점 커피 한 잔 정도의 값으로 잡았다. "이걸 한 번 쓰는 데 커피 한 잔 값을
 * 낼 만한가?"라고 스스로 물어볼 수 있는 크기라서 골랐다.
 * 기준을 바꾸고 싶으면 이 숫자만 고치면 화면과 진단이 전부 따라 바뀐다.
 */
export const COST_PER_USE_LIMIT = 3000;

/** 이용 횟수를 어디서 가져왔는지 */
export type CountSource = "logs" | "manual";

export type SubscriptionStat = {
  subscription: Subscription;
  service: Service | undefined;
  name: string;
  color: string;
  /** 날짜로 남긴 이용 기록 개수 */
  loggedCount: number;
  /** 월 단위로 몰아서 입력한 값. 입력 안 했으면 null */
  manualCount: number | null;
  /** 실제로 쓰는 이용 횟수 */
  usageCount: number;
  countSource: CountSource;
  /** 1회당 비용. 이용 횟수가 0이면 null (0으로 나눌 수 없음) */
  costPerUse: number | null;
  isCancelCandidate: boolean;
  /** 사람이 읽을 수 있는 판단 이유 */
  reason: string;
};

/**
 * 이번 달 이용 횟수를 센다.
 *
 * 날짜별 기록과 월 단위 몰아 입력이 둘 다 있으면 **몰아 입력을 우선**으로 쓴다.
 * 몰아 입력은 "날짜는 기억 안 나는데 이만큼 썼다"는 뜻이라, 사용자가 더 나중에
 * 더 정확하게 알려 준 값이라고 보기 때문이다.
 * 대신 화면에서 어느 쪽 값을 쓰고 있는지 반드시 같이 보여 줘야 헷갈리지 않는다.
 */
export function countUsage(data: AppData, subscriptionId: string, month: string) {
  const loggedCount = data.usageLogs.filter(
    (log) => log.subscriptionId === subscriptionId && monthKeyOf(log.date) === month,
  ).length;

  const manual = data.monthlyCounts.find(
    (item) => item.subscriptionId === subscriptionId && item.month === month,
  );
  const manualCount = manual ? manual.count : null;

  return {
    loggedCount,
    manualCount,
    usageCount: manualCount ?? loggedCount,
    countSource: (manualCount !== null ? "manual" : "logs") as CountSource,
  };
}

/**
 * 1회당 실제 비용 = 월 요금 ÷ 이번 달 이용 횟수
 *
 * 이용 횟수가 0이면 나눗셈이 안 된다(0으로 나누기).
 * 무한대를 그대로 화면에 흘리면 "1회당 Infinity원"이 뜨므로 null을 돌려주고,
 * 화면에서는 "이번 달 이용 기록 없음"으로 따로 표시한다.
 *
 * 0회를 '아주 비싼 값'으로 치지 않고 따로 뺀 이유:
 * 0회는 계산이 안 되는 게 아니라 "한 번도 안 썼다"는 가장 강한 해지 신호다.
 * 억지로 숫자를 만들기보다 따로 표시하는 편이 정직하고, 진단하기도 쉽다.
 */
export function costPerUse(monthlyPrice: number, usageCount: number): number | null {
  if (usageCount <= 0) return null;
  return monthlyPrice / usageCount;
}

/** 구독 하나하나에 대해 계산과 판단을 끝낸 결과를 만든다. */
export function buildStats(data: AppData, month: string): SubscriptionStat[] {
  return data.subscriptions.map((subscription) => {
    const { loggedCount, manualCount, usageCount, countSource } = countUsage(
      data,
      subscription.id,
      month,
    );
    const perUse = costPerUse(subscription.monthlyPrice, usageCount);

    let isCancelCandidate: boolean;
    let reason: string;

    if (usageCount === 0) {
      isCancelCandidate = true;
      reason = "이번 달에 한 번도 쓰지 않았어요";
    } else if (perUse !== null && perUse >= COST_PER_USE_LIMIT) {
      isCancelCandidate = true;
      reason = `1회당 ${won(perUse)}으로 기준 ${won(COST_PER_USE_LIMIT)}보다 비싸요`;
    } else {
      isCancelCandidate = false;
      reason = `1회당 ${won(perUse ?? 0)}으로 기준 ${won(COST_PER_USE_LIMIT)} 안쪽이에요`;
    }

    return {
      subscription,
      service: findService(subscription.serviceId),
      name: serviceName(subscription.serviceId),
      color: serviceColor(subscription.serviceId),
      loggedCount,
      manualCount,
      usageCount,
      countSource,
      costPerUse: perUse,
      isCancelCandidate,
      reason,
    };
  });
}

/**
 * 해지 우선순위 순으로 줄을 세운다.
 *
 * 1) 이번 달에 한 번도 안 쓴 구독을 맨 위로 (요금이 큰 것부터)
 * 2) 그다음은 1회당 비용이 비싼 순서
 */
export function sortByCancelPriority(stats: SubscriptionStat[]): SubscriptionStat[] {
  return [...stats].sort((a, b) => {
    if (a.costPerUse === null && b.costPerUse === null) {
      return b.subscription.monthlyPrice - a.subscription.monthlyPrice;
    }
    if (a.costPerUse === null) return -1;
    if (b.costPerUse === null) return 1;
    return b.costPerUse - a.costPerUse;
  });
}

/** 매달 빠져나가는 구독료 총액 */
export function totalMonthlyCost(stats: SubscriptionStat[]): number {
  return stats.reduce((sum, stat) => sum + stat.subscription.monthlyPrice, 0);
}

/** 해지 후보만 모은다 */
export function cancelCandidates(stats: SubscriptionStat[]): SubscriptionStat[] {
  return sortByCancelPriority(stats).filter((stat) => stat.isCancelCandidate);
}

/**
 * 절약 예상 최대액 = 해지 후보를 전부 끊었을 때 아끼는 돈.
 *
 * '최대'인 이유: 후보를 전부 끊는 건 가장 극단적인 선택이라, 실제로는 이보다
 * 덜 아끼게 된다. 그래서 "여기까지 아낄 수 있다"는 위쪽 한계로 보여 준다.
 */
export function maxSaving(stats: SubscriptionStat[]): number {
  return cancelCandidates(stats).reduce(
    (sum, stat) => sum + stat.subscription.monthlyPrice,
    0,
  );
}

// ---- 대체 서비스 추천 ----

export type Alternative = {
  service: Service;
  /** 이걸로 바꾸면 매달 아끼는 돈 */
  saving: number;
};

/**
 * 같은 카테고리에서 지금보다 싼 서비스를 찾아 아끼는 돈이 큰 순서로 돌려준다.
 *
 * 카테고리를 기준으로 삼은 이유: 넷플릭스를 끊고 멜론을 쓰라는 건 말이 안 된다.
 * "비슷한 일을 대신 할 수 있는가"가 기준이어야 해서, 서비스 목록을 만들 때부터
 * 그 기준으로 카테고리를 나눠 두었다. (docs/services-research.md 2장)
 *
 * 값을 비교할 때 조사해 둔 기본 요금(defaultPrice)을 쓰기 때문에,
 * 사용자가 할인받아 더 싸게 쓰고 있다면 실제 절약액은 이보다 작을 수 있다.
 */
export function findAlternatives(
  currentServiceId: string,
  currentMonthlyPrice: number,
  limit = 3,
): Alternative[] {
  const current = findService(currentServiceId);
  if (!current) return [];

  return SERVICES.filter(
    (service) =>
      service.category === current.category &&
      service.id !== current.id &&
      service.defaultPrice < currentMonthlyPrice,
  )
    .map((service) => ({
      service,
      saving: currentMonthlyPrice - service.defaultPrice,
    }))
    .sort((a, b) => b.saving - a.saving)
    .slice(0, limit);
}

/**
 * 요일별 이용 횟수를 센다. 0번이 월요일, 6번이 일요일.
 *
 * 계획서 스케치에는 '요일별 이용 시간'이라고 적었지만, 지금은 이용 시간(분)을
 * 받지 않고 '그날 썼다/안 썼다'만 기록하므로 정직하게 '횟수'로 센다.
 */
export function weekdayCounts(data: AppData, subscriptionId: string): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];

  for (const log of data.usageLogs) {
    if (log.subscriptionId !== subscriptionId) continue;
    // weekdayOf는 0이 일요일이라, 월요일이 0이 되도록 옮긴다.
    counts[(weekdayOf(log.date) + 6) % 7] += 1;
  }

  return counts;
}

// ---- 습관 유형 판정 ----

export type HabitFacts = {
  /** 구독 개수 */
  total: number;
  /** 이번 달 한 번도 안 쓴 구독 수 */
  unusedCount: number;
  /** 해지 후보 수 */
  candidateCount: number;
};

export type HabitRule = {
  type: string;
  oneLine: string;
  /** 이 유형으로 판정하는 기준을 사람 말로 적은 것 */
  criteria: string;
  matches: (facts: HabitFacts) => boolean;
};

/**
 * 위에서부터 순서대로 확인해서 처음 걸리는 유형으로 정한다.
 *
 * 순서를 이렇게 정한 이유: '한 번도 안 쓴 구독'이 있다는 건 다른 어떤 신호보다
 * 강한 낭비 신호라서 가장 먼저 걸러야 한다고 봤다.
 */
export const HABIT_RULES: HabitRule[] = [
  {
    type: "방치형",
    oneLine: "결제는 하지만 손은 잘 안 가요",
    criteria: "이번 달에 한 번도 안 쓴 구독이 1개 이상 있다",
    matches: (facts) => facts.unusedCount >= 1,
  },
  {
    type: "과금형",
    oneLine: "쓰긴 쓰는데, 한 번 쓸 때마다 비싸요",
    criteria: `해지 후보가 전체 구독의 절반 이상이다`,
    matches: (facts) => facts.candidateCount * 2 >= facts.total,
  },
  {
    type: "알뜰형",
    oneLine: "낸 돈만큼 알차게 쓰고 있어요",
    criteria: "해지 후보가 하나도 없다",
    matches: (facts) => facts.candidateCount === 0,
  },
  {
    type: "무난형",
    oneLine: "크게 손해 보고 있진 않아요",
    criteria: "위 조건에 모두 해당하지 않는다",
    matches: () => true,
  },
];

export type HabitResult = {
  type: string;
  oneLine: string;
  criteria: string;
  facts: HabitFacts;
  /** 구독이 하나도 없어서 판정할 수 없는 경우 */
  undiagnosable: boolean;
};

export function judgeHabit(stats: SubscriptionStat[]): HabitResult {
  const facts: HabitFacts = {
    total: stats.length,
    unusedCount: stats.filter((stat) => stat.usageCount === 0).length,
    candidateCount: stats.filter((stat) => stat.isCancelCandidate).length,
  };

  if (stats.length === 0) {
    return {
      type: "아직 진단 전",
      oneLine: "구독을 먼저 등록해 주세요",
      criteria: "등록된 구독이 없다",
      facts,
      undiagnosable: true,
    };
  }

  const rule = HABIT_RULES.find((item) => item.matches(facts)) ?? HABIT_RULES.at(-1)!;

  return {
    type: rule.type,
    oneLine: rule.oneLine,
    criteria: rule.criteria,
    facts,
    undiagnosable: false,
  };
}
