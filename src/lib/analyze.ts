// 처리(Process) 단계. 계획서 IPO의 가운데 부분.
//
// 중요한 점: 이 파일은 "답"만 돌려주지 않고 "왜 그렇게 판단했는지"도 같이 돌려준다.
// 상세 진단 화면(/diagnosis)이 그 이유를 그대로 받아서 사람이 읽을 수 있게 보여 준다.
//
// 판단 흐름
//   1) 이번 달 이용 횟수를 센다
//   2) 카테고리 기준과 비교해 '이용 강도'를 정한다 (안 씀 / 적게 / 보통 / 자주)
//   3) 강도에 맞는 행동을 고른다 (해지 / 요금제 낮추기 / 유지 / 요금제 올리기 / 갈아타기)
//   4) 구독을 하나씩이 아니라 전체로 보고 중복·묶음·몰림을 찾는다

import { BUNDLES } from "@/data/bundles";
import {
  CATEGORIES,
  SERVICES,
  defaultPlanOf,
  defaultPriceOf,
  findPlan,
  findService,
  guessPlan,
  serviceColor,
  serviceName,
  type CategoryId,
  type Plan,
  type Service,
} from "@/data/services";
import { monthKeyOf, weekdayOf } from "./date";
import { particle, won } from "./format";
import type { AppData, Subscription } from "./types";

/**
 * 이미 다른 멤버십에 포함돼 있어서 따로 돈을 낼 필요가 없는 서비스들.
 *
 * 예: 쿠팡 와우를 구독 중이면 쿠팡플레이는 여기에 들어간다.
 * 이런 구독에는 "갈아타세요" 같은 추천을 하면 안 된다.
 * 이미 공짜로 쓸 수 있는데 돈을 더 쓰라고 하는 셈이기 때문이다.
 */
export function coveredServiceIds(data: AppData): Map<string, string> {
  const covered = new Map<string, string>();

  for (const bundle of BUNDLES) {
    const hasHost = data.subscriptions.some(
      (item) => item.serviceId === bundle.hostServiceId,
    );
    if (!hasHost) continue;

    // 하나만 고를 수 있는 묶음이면 먼저 나온 것 하나만 덮인다.
    const owned = bundle.includedServiceIds.filter((serviceId) =>
      data.subscriptions.some((item) => item.serviceId === serviceId),
    );
    const target = bundle.chooseOne ? owned.slice(0, 1) : owned;

    for (const serviceId of target) covered.set(serviceId, bundle.name);
  }

  return covered;
}

// ---------------------------------------------------------------
// 1. 이용 횟수 세기
// ---------------------------------------------------------------

export type CountSource = "logs" | "manual";

/**
 * 이번 달 이용 횟수를 센다.
 *
 * 날짜별 기록과 월 단위 몰아 입력이 둘 다 있으면 몰아 입력을 우선으로 쓴다.
 * 몰아 입력은 "날짜는 기억 안 나는데 이만큼 썼다"는 뜻이라 사용자가 더 나중에
 * 더 정확하게 알려 준 값이라고 보기 때문이다.
 * 대신 화면에서 어느 쪽 값을 쓰는지 반드시 같이 보여 줘야 헷갈리지 않는다.
 */
export function countUsage(data: AppData, subscriptionId: string, month: string) {
  const monthLogs = data.usageLogs.filter(
    (log) => log.subscriptionId === subscriptionId && monthKeyOf(log.date) === month,
  );

  const manual = data.monthlyCounts.find(
    (item) => item.subscriptionId === subscriptionId && item.month === month,
  );
  const manualCount = manual ? manual.count : null;

  const minutes = monthLogs.reduce((sum, log) => sum + (log.minutes || 0), 0);
  const minutesLogged = monthLogs.filter((log) => (log.minutes || 0) > 0).length;

  return {
    loggedCount: monthLogs.length,
    manualCount,
    usageCount: manualCount ?? monthLogs.length,
    countSource: (manualCount !== null ? "manual" : "logs") as CountSource,
    /** 이번 달 총 이용 시간(분). 시간을 안 적었으면 0 */
    totalMinutes: minutes,
    /** 시간을 적은 기록 한 번당 평균 분. 적은 기록이 없으면 null */
    averageMinutes: minutesLogged > 0 ? Math.round(minutes / minutesLogged) : null,
  };
}

/**
 * 1회당 실제 비용 = 월 요금 ÷ 이번 달 이용 횟수
 *
 * 이용 횟수가 0이면 나눌 수 없어서 null을 돌려주고 화면에서 따로 표시한다.
 * 0회는 계산이 안 되는 게 아니라 "한 번도 안 썼다"는 가장 강한 해지 신호다.
 *
 * 참고: 이 값은 이제 '판정 기준'이 아니라 '보여 주는 지표'다.
 * 1회당 비용만 보면 많이 쓸수록 무조건 좋은 게 되어,
 * "자주 쓰니 더 나은 요금제로 올리세요" 같은 추천이 나올 수 없기 때문이다.
 */
export function costPerUse(monthlyPrice: number, usageCount: number): number | null {
  if (usageCount <= 0) return null;
  return monthlyPrice / usageCount;
}

// ---------------------------------------------------------------
// 2. 이용 강도
// ---------------------------------------------------------------

export type Intensity = "none" | "low" | "medium" | "high";

export const INTENSITY_LABELS: Record<Intensity, string> = {
  none: "한 번도 안 씀",
  low: "거의 안 씀",
  medium: "적당히 씀",
  high: "자주 씀",
};

/**
 * 카테고리마다 '한 달에 이 정도면 보통이다'가 다르다.
 *
 * 같은 26회라도 음악은 평범하고 영상은 헤비 유저다.
 * 그래서 하나의 기준으로 재면 안 되고 카테고리별로 경계를 따로 둔다.
 *
 * 아래 숫자는 정답이 있는 값이 아니라 내가 정한 기준선이다.
 * 근거를 note에 적어 두었고, 바꾸고 싶으면 이 표만 고치면 화면 전체가 따라 바뀐다.
 */
export const INTENSITY_LIMITS: Record<
  CategoryId,
  { low: number; medium: number; note: string }
> = {
  ott: {
    low: 2,
    medium: 7,
    note: "주 2회(월 8회) 이상 보면 자주 보는 편이라고 봤다",
  },
  music: {
    low: 5,
    medium: 15,
    note: "음악은 매일 듣는 사람이 많아 기준을 높게 잡았다",
  },
  commerce: {
    low: 1,
    medium: 4,
    note: "무료배송 한 번에 3천원쯤 아끼니 월 2~3회면 회비는 뽑는다",
  },
  ai: {
    low: 3,
    medium: 10,
    note: "주 1회 이하로 쓰면 굳이 유료로 둘 이유가 적다",
  },
};

export function intensityOf(usageCount: number, category: CategoryId): Intensity {
  if (usageCount <= 0) return "none";

  const limits = INTENSITY_LIMITS[category];
  if (usageCount <= limits.low) return "low";
  if (usageCount <= limits.medium) return "medium";
  return "high";
}

// ---------------------------------------------------------------
// 3. 추천
// ---------------------------------------------------------------

export type SuggestionKind =
  | "cancel"
  | "downgrade"
  | "switch-cheaper"
  | "switch-richer"
  | "upgrade"
  | "keep";

export const SUGGESTION_LABELS: Record<SuggestionKind, string> = {
  cancel: "해지",
  downgrade: "요금제 낮추기",
  "switch-cheaper": "더 싼 서비스로",
  "switch-richer": "더 큰 서비스로",
  upgrade: "요금제 올리기",
  keep: "유지",
};

/** 손볼 게 큰 것부터 위로 올리기 위한 순서 */
const KIND_PRIORITY: Record<SuggestionKind, number> = {
  cancel: 0,
  downgrade: 1,
  "switch-cheaper": 2,
  "switch-richer": 3,
  upgrade: 4,
  keep: 5,
};

export type Suggestion = {
  kind: SuggestionKind;
  title: string;
  /** 매달 아끼는 돈. 음수면 오히려 더 내는 것 */
  saving: number;
  reason: string;
  /** 이걸 택하면 잃는 것 / 감안할 것 */
  tradeoff: string;
  targetServiceId?: string;
  targetPlanId?: string;
};

/** 요금제를 바꿨을 때 뭐가 달라지는지 사람 말로 적는다. */
function planDiffText(from: Plan, to: Plan): string {
  const parts: string[] = [];

  if (!from.ads && to.ads) parts.push("광고가 붙습니다");
  if (from.ads && !to.ads) parts.push("광고가 사라집니다");

  if (from.qualityRank !== undefined && to.qualityRank !== undefined) {
    if (to.qualityRank < from.qualityRank) {
      parts.push(`화질·음질이 ${from.quality} → ${to.quality}로 내려갑니다`);
    } else if (to.qualityRank > from.qualityRank) {
      parts.push(`화질·음질이 ${from.quality} → ${to.quality}로 올라갑니다`);
    }
  }

  if (from.devices !== undefined && to.devices !== undefined) {
    if (to.devices < from.devices) {
      parts.push(`동시 사용이 ${from.devices}대 → ${to.devices}대로 줄어듭니다`);
    } else if (to.devices > from.devices) {
      parts.push(`동시 사용이 ${to.devices}대로 늘어납니다`);
    }
  }

  if (from.offline === true && to.offline === false) {
    parts.push("오프라인 저장이 안 됩니다");
  }

  if (to.note) parts.push(to.note);

  return parts.length > 0 ? parts.join(" · ") : "달라지는 기능은 없습니다";
}

/** 지금 요금제보다 싼 요금제 후보. 가장 싼 것과, 광고 없는 것 중 가장 싼 것. */
function downgradeTargets(service: Service, current: Plan): Plan[] {
  const cheaper = service.plans.filter((plan) => plan.price < current.price);
  if (cheaper.length === 0) return [];

  const sorted = [...cheaper].sort((a, b) => a.price - b.price);
  const picks = [sorted[0]];

  // 광고가 싫은 사람을 위해 '광고 없는 것 중 가장 싼 것'도 같이 보여 준다.
  const cheapestNoAds = sorted.find((plan) => !plan.ads);
  if (cheapestNoAds && cheapestNoAds.id !== sorted[0].id) picks.push(cheapestNoAds);

  return picks;
}

function buildSuggestions(
  subscription: Subscription,
  service: Service | undefined,
  plan: Plan | undefined,
  intensity: Intensity,
  usageCount: number,
  averageMinutes: number | null,
  coveredBy: string | undefined,
): Suggestion[] {
  if (!service) return [];

  const price = subscription.monthlyPrice;

  // 이미 다른 멤버십에 포함돼 있으면 다른 추천은 의미가 없다.
  // 공짜로 쓸 수 있는 것에 "갈아타세요"라고 하면 돈을 더 쓰라는 말이 된다.
  if (coveredBy) {
    return [
      {
        kind: "cancel",
        title: "따로 내는 결제만 멈추기",
        saving: price,
        reason: `${coveredBy}${particle(coveredBy, "에", "에")} 이미 포함돼 있어서 따로 낼 필요가 없습니다`,
        tradeoff: `${coveredBy}${particle(coveredBy, "을", "를")} 유지하는 한 그대로 쓸 수 있습니다`,
      },
    ];
  }

  const suggestions: Suggestion[] = [];

  // 같은 카테고리의 다른 서비스들
  const siblings = SERVICES.filter(
    (item) => item.category === service.category && item.id !== service.id,
  );

  const cheaperServices = siblings
    .filter((item) => defaultPriceOf(item) < price)
    .map((item) => ({ service: item, saving: price - defaultPriceOf(item) }))
    .sort((a, b) => b.saving - a.saving)
    .slice(0, 2);

  const richerServices =
    service.reach === undefined
      ? []
      : siblings
          .filter((item) => item.reach !== undefined && item.reach > service.reach!)
          .sort((a, b) => b.reach! - a.reach!)
          .slice(0, 2);

  const downgrades = plan ? downgradeTargets(service, plan) : [];

  // --- 강도별로 행동을 고른다 ---

  if (intensity === "none") {
    suggestions.push({
      kind: "cancel",
      title: "해지하기",
      saving: price,
      reason: "이번 달에 한 번도 쓰지 않았습니다",
      tradeoff: "나중에 다시 필요하면 그때 가입하면 됩니다",
    });
  }

  if (intensity === "low") {
    suggestions.push({
      kind: "cancel",
      title: "해지하기",
      saving: price,
      reason: `이번 달에 ${usageCount}번밖에 쓰지 않았습니다`,
      tradeoff: "나중에 다시 필요하면 그때 가입하면 됩니다",
    });

    for (const target of downgrades) {
      suggestions.push({
        kind: "downgrade",
        title: `${target.name}${particle(target.name, "으로", "로")} 낮추기`,
        saving: price - target.price,
        reason: "끊기는 아깝다면 가장 싼 요금제로 내려 두는 방법도 있습니다",
        tradeoff: plan ? planDiffText(plan, target) : "",
        targetServiceId: service.id,
        targetPlanId: target.id,
      });
    }
  }

  if (intensity === "medium") {
    for (const target of downgrades) {
      const shortSessions =
        averageMinutes !== null && averageMinutes < 30
          ? ` 한 번에 평균 ${averageMinutes}분만 보기 때문에 화질이나 동시접속을 다 쓰고 있지도 않습니다.`
          : "";

      suggestions.push({
        kind: "downgrade",
        title: `${target.name}${particle(target.name, "으로", "로")} 낮추기`,
        saving: price - target.price,
        reason: `끊을 정도는 아니지만 한 달 ${usageCount}번 쓰기에는 지금 요금제가 과합니다.${shortSessions}`,
        tradeoff: plan ? planDiffText(plan, target) : "",
        targetServiceId: service.id,
        targetPlanId: target.id,
      });
    }

    if (downgrades.length === 0) {
      for (const item of cheaperServices) {
        suggestions.push({
          kind: "switch-cheaper",
          title: `${item.service.name}${particle(item.service.name, "으로", "로")} 갈아타기`,
          saving: item.saving,
          reason: "이미 가장 싼 요금제라, 더 아끼려면 서비스를 바꿔야 합니다",
          tradeoff: item.service.weakness,
          targetServiceId: item.service.id,
          targetPlanId: defaultPlanOf(item.service).id,
        });
      }
    }
  }

  if (intensity === "high") {
    // 자주 쓰는데 광고를 계속 보고 있거나 가장 싼 요금제에 머물러 있으면 올리는 걸 제안
    const pricier = plan
      ? service.plans
          .filter((item) => item.price > plan.price)
          .sort((a, b) => a.price - b.price)[0]
      : undefined;

    const stuckOnLowest =
      plan && (plan.ads || plan.id === service.plans[0].id) && pricier !== undefined;

    if (stuckOnLowest && plan && pricier) {
      suggestions.push({
        kind: "upgrade",
        title: `${pricier.name}${particle(pricier.name, "으로", "로")} 올리기`,
        saving: price - pricier.price, // 보통 음수 (더 냄)
        reason: `한 달 ${usageCount}번이나 쓰는데 ${plan.ads ? "계속 광고를 보고 계십니다" : "가장 낮은 요금제에 머물러 있습니다"}`,
        tradeoff: planDiffText(plan, pricier),
        targetServiceId: service.id,
        targetPlanId: pricier.id,
      });
    }

    for (const target of richerServices) {
      suggestions.push({
        kind: "switch-richer",
        title: `${target.name}${particle(target.name, "으로", "로")} 갈아타기`,
        saving: price - defaultPriceOf(target),
        reason: `한 달 ${usageCount}번이나 쓸 만큼 이 카테고리를 좋아하는데, ${target.name}가 더 폭넓게 쓰입니다 (${target.reachNote})`,
        tradeoff: target.weakness,
        targetServiceId: target.id,
        targetPlanId: defaultPlanOf(target).id,
      });
    }
  }

  if (suggestions.length === 0) {
    suggestions.push({
      kind: "keep",
      title: "그대로 두기",
      saving: 0,
      reason:
        intensity === "high"
          ? `한 달 ${usageCount}번이나 쓰고 있습니다. 낸 돈만큼 쓰는 중입니다`
          : `한 달 ${usageCount}번이면 지금 요금제가 알맞습니다`,
      tradeoff: "",
    });
  }

  return suggestions.sort(
    (a, b) => KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind] || b.saving - a.saving,
  );
}

// ---------------------------------------------------------------
// 구독 하나에 대한 계산 결과
// ---------------------------------------------------------------

export type SubscriptionStat = {
  subscription: Subscription;
  service: Service | undefined;
  plan: Plan | undefined;
  name: string;
  planName: string;
  color: string;
  loggedCount: number;
  manualCount: number | null;
  usageCount: number;
  countSource: CountSource;
  totalMinutes: number;
  averageMinutes: number | null;
  costPerUse: number | null;
  intensity: Intensity;
  suggestions: Suggestion[];
  /** 가장 먼저 권하는 것 */
  primary: Suggestion;
};

export function buildStats(data: AppData, month: string): SubscriptionStat[] {
  // 다른 멤버십에 이미 포함된 서비스는 추천 자체가 달라진다.
  const covered = coveredServiceIds(data);

  return data.subscriptions.map((subscription) => {
    const counted = countUsage(data, subscription.id, month);
    const service = findService(subscription.serviceId);

    // 요금제를 저장하기 전에 등록한 구독이 있을 수 있어서, 없으면 금액으로 찾아 준다.
    const plan =
      findPlan(subscription.serviceId, subscription.planId) ??
      guessPlan(subscription.serviceId, subscription.monthlyPrice);

    const intensity = service
      ? intensityOf(counted.usageCount, service.category)
      : "none";

    const suggestions = buildSuggestions(
      subscription,
      service,
      plan,
      intensity,
      counted.usageCount,
      counted.averageMinutes,
      covered.get(subscription.serviceId),
    );

    return {
      subscription,
      service,
      plan,
      name: serviceName(subscription.serviceId),
      planName: plan?.name ?? "요금제 모름",
      color: serviceColor(subscription.serviceId),
      ...counted,
      costPerUse: costPerUse(subscription.monthlyPrice, counted.usageCount),
      intensity,
      suggestions,
      primary: suggestions[0] ?? {
        kind: "keep",
        title: "그대로 두기",
        saving: 0,
        reason: "",
        tradeoff: "",
      },
    };
  });
}

/** 손볼 게 큰 것부터 줄을 세운다. */
export function sortByPriority(stats: SubscriptionStat[]): SubscriptionStat[] {
  return [...stats].sort(
    (a, b) =>
      KIND_PRIORITY[a.primary.kind] - KIND_PRIORITY[b.primary.kind] ||
      b.primary.saving - a.primary.saving,
  );
}

export function totalMonthlyCost(stats: SubscriptionStat[]): number {
  return stats.reduce((sum, stat) => sum + stat.subscription.monthlyPrice, 0);
}

/** 돈을 아끼는 쪽 추천만 (요금제 올리기는 돈을 더 쓰는 것이라 뺀다) */
export function savingSuggestions(stats: SubscriptionStat[]): SubscriptionStat[] {
  return sortByPriority(stats).filter(
    (stat) =>
      stat.primary.saving > 0 &&
      (stat.primary.kind === "cancel" ||
        stat.primary.kind === "downgrade" ||
        stat.primary.kind === "switch-cheaper"),
  );
}

/**
 * 절약 예상 최대액.
 *
 * 추천을 전부 따랐을 때 아끼는 돈이라, 실제로는 이보다 덜 아끼게 된다.
 * 그래서 '최대'라고 적는다.
 */
export function maxSaving(stats: SubscriptionStat[]): number {
  return savingSuggestions(stats).reduce((sum, stat) => sum + stat.primary.saving, 0);
}

// ---------------------------------------------------------------
// 4. 구독 전체를 함께 보기 (중복 · 묶음 · 몰림)
// ---------------------------------------------------------------

export type PortfolioIssueKind = "duplicate" | "bundle" | "consolidate";

export type PortfolioIssue = {
  kind: PortfolioIssueKind;
  title: string;
  saving: number;
  reason: string;
  action: string;
  subscriptionIds: string[];
};

export const PORTFOLIO_LABELS: Record<PortfolioIssueKind, string> = {
  duplicate: "중복 결제",
  bundle: "묶음 상품",
  consolidate: "너무 많음",
};

export function findPortfolioIssues(
  data: AppData,
  stats: SubscriptionStat[],
): PortfolioIssue[] {
  const issues: PortfolioIssue[] = [];
  const has = (serviceId: string) =>
    data.subscriptions.find((item) => item.serviceId === serviceId);

  for (const bundle of BUNDLES) {
    const host = has(bundle.hostServiceId);
    const owned = bundle.includedServiceIds
      .map((serviceId) => ({ serviceId, subscription: has(serviceId) }))
      .filter((item) => item.subscription !== undefined);

    if (owned.length === 0) continue;

    if (host) {
      // 이미 묶음을 갖고 있는데 안에 든 걸 또 따로 내고 있다
      // 하나만 고를 수 있는 묶음이면 가장 비싼 것 하나만 혜택으로 덮인다
      const covered = bundle.chooseOne ? owned.slice(0, 1) : owned;

      for (const item of covered) {
        const subscription = item.subscription!;
        const includedPlanId = bundle.includedPlanIds?.[item.serviceId];
        const includedPlan = includedPlanId
          ? findPlan(item.serviceId, includedPlanId)
          : undefined;

        // 혜택으로 주는 요금제가 정해져 있으면 그 금액만큼만 덮인다
        const saving = includedPlan
          ? Math.min(subscription.monthlyPrice, includedPlan.price)
          : subscription.monthlyPrice;

        if (saving <= 0) continue;

        issues.push({
          kind: "duplicate",
          title: `${serviceName(item.serviceId)}${particle(serviceName(item.serviceId), "을", "를")} 따로 내고 있습니다`,
          saving,
          reason: `${bundle.name}${particle(bundle.name, "을", "를")} 이미 구독 중입니다. ${bundle.note}.`,
          action: includedPlan
            ? `${bundle.name} 혜택으로 ${includedPlan.name}을 받으면 그만큼 덜 냅니다`
            : `${serviceName(item.serviceId)} 결제를 멈춰도 그대로 쓸 수 있습니다`,
          subscriptionIds: [subscription.id, host.id],
        });
      }
    } else {
      // 묶음은 없는데 안에 든 걸 따로 내고 있다 -> 묶음으로 갈아타면 싸질 수 있다
      const hostService = findService(bundle.hostServiceId);
      if (!hostService) continue;

      const hostPrice = defaultPriceOf(hostService);
      const target = bundle.chooseOne ? owned.slice(0, 1) : owned;

      const covered = target.reduce((sum, item) => {
        const subscription = item.subscription!;
        const includedPlanId = bundle.includedPlanIds?.[item.serviceId];
        const includedPlan = includedPlanId
          ? findPlan(item.serviceId, includedPlanId)
          : undefined;
        return (
          sum +
          (includedPlan
            ? Math.min(subscription.monthlyPrice, includedPlan.price)
            : subscription.monthlyPrice)
        );
      }, 0);

      const saving = covered - hostPrice;
      if (saving <= 0) continue;

      issues.push({
        kind: "bundle",
        title: `${bundle.name}${particle(bundle.name, "을", "를")} 쓰면 더 쌉니다`,
        saving,
        reason: `${bundle.note}.`,
        action: `${bundle.name}(${won(hostPrice)})에 가입하면 ${target
          .map((item) => {
            const includedPlanId = bundle.includedPlanIds?.[item.serviceId];
            const includedPlan = includedPlanId
              ? findPlan(item.serviceId, includedPlanId)
              : undefined;
            return includedPlan
              ? `${serviceName(item.serviceId)} ${includedPlan.name}`
              : serviceName(item.serviceId);
          })
          .join(", ")} 혜택이 들어 있어서 매달 ${won(saving)}을 아낍니다`,
        subscriptionIds: target.map((item) => item.subscription!.id),
      });
    }
  }

  // 같은 카테고리를 여러 개 들고 있는데 다 합쳐도 별로 안 쓰는 경우
  for (const category of CATEGORIES) {
    const inCategory = stats.filter((stat) => stat.service?.category === category.id);
    if (inCategory.length < 3) continue;

    const totalUse = inCategory.reduce((sum, stat) => sum + stat.usageCount, 0);
    if (totalUse > INTENSITY_LIMITS[category.id].medium) continue;

    const sorted = [...inCategory].sort((a, b) => b.usageCount - a.usageCount);
    const keep = sorted[0];
    const drop = sorted.slice(1);

    issues.push({
      kind: "consolidate",
      title: `${category.label}${particle(category.label, "을", "를")} ${inCategory.length}개나 들고 있습니다`,
      saving: drop.reduce((sum, stat) => sum + stat.subscription.monthlyPrice, 0),
      reason: `${inCategory.length}개를 합쳐도 이번 달에 ${totalUse}번밖에 안 썼습니다.`,
      action: `가장 많이 쓴 ${keep.name} 하나만 남기는 것을 생각해 보세요`,
      subscriptionIds: drop.map((stat) => stat.subscription.id),
    });
  }

  return issues.sort((a, b) => b.saving - a.saving);
}

// ---------------------------------------------------------------
// 요일별 패턴
// ---------------------------------------------------------------

/** 0번이 월요일, 6번이 일요일 */
function weekdayBuckets(
  data: AppData,
  subscriptionId: string,
  pick: (minutes: number) => number,
): number[] {
  const buckets = [0, 0, 0, 0, 0, 0, 0];

  for (const log of data.usageLogs) {
    if (log.subscriptionId !== subscriptionId) continue;
    // weekdayOf는 0이 일요일이라, 월요일이 0이 되도록 옮긴다.
    buckets[(weekdayOf(log.date) + 6) % 7] += pick(log.minutes || 0);
  }

  return buckets;
}

export function weekdayCounts(data: AppData, subscriptionId: string): number[] {
  return weekdayBuckets(data, subscriptionId, () => 1);
}

export function weekdayMinutes(data: AppData, subscriptionId: string): number[] {
  return weekdayBuckets(data, subscriptionId, (minutes) => minutes);
}

// ---------------------------------------------------------------
// 습관 유형 판정
// ---------------------------------------------------------------

export type HabitFacts = {
  total: number;
  /** 한 번도 안 쓴 구독 수 */
  unusedCount: number;
  /** 손볼 게 있는 구독 수 (해지·낮추기·갈아타기) */
  fixableCount: number;
  /** 자주 쓰는 구독 수 */
  heavyCount: number;
};

export type HabitRule = {
  type: string;
  oneLine: string;
  criteria: string;
  matches: (facts: HabitFacts) => boolean;
};

/**
 * 위에서부터 순서대로 확인해서 처음 걸리는 유형으로 정한다.
 * '한 번도 안 쓴 구독'이 다른 어떤 신호보다 강한 낭비 신호라서 맨 위에 두었다.
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
    oneLine: "쓰긴 쓰는데, 지금 요금이 이용량에 비해 큽니다",
    criteria: "손볼 구독이 전체의 절반 이상이다",
    matches: (facts) => facts.fixableCount * 2 >= facts.total,
  },
  {
    type: "몰입형",
    oneLine: "본전은 확실히 뽑고 계세요",
    criteria: "자주 쓰는 구독이 전체의 절반 이상이다",
    matches: (facts) => facts.heavyCount * 2 >= facts.total,
  },
  {
    type: "알뜰형",
    oneLine: "낸 돈만큼 알차게 쓰고 있어요",
    criteria: "손볼 구독이 하나도 없다",
    matches: (facts) => facts.fixableCount === 0,
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
  undiagnosable: boolean;
};

export function judgeHabit(stats: SubscriptionStat[]): HabitResult {
  const facts: HabitFacts = {
    total: stats.length,
    unusedCount: stats.filter((stat) => stat.intensity === "none").length,
    fixableCount: stats.filter(
      (stat) => stat.primary.kind !== "keep" && stat.primary.kind !== "upgrade",
    ).length,
    heavyCount: stats.filter((stat) => stat.intensity === "high").length,
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
