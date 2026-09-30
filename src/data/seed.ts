// 처음 켰을 때 들어 있는 샘플 데이터.
//
// 계획서 5번의 "발표 시연용 가상 사용자 샘플 로그"에 해당한다.
// 추천이 다섯 종류 다 나오도록 일부러 서로 다른 습관을 가진 구독을 섞어 두었다.
//
//   티빙    0회   -> 해지
//   넷플릭스 4회   -> 프리미엄은 과하니 광고형으로 낮추기
//   쿠팡 와우 6회  -> 유지
//   쿠팡플레이 20회 -> 와우에 포함돼 있으므로 중복 (게다가 자주 봄)
//   유튜브   26회  -> 유지
//
// 날짜를 고정해 두면 다음 달에 열었을 때 달력이 비어 보이므로
// '이번 달 며칠'만 정해 두고 실제 날짜는 열 때 계산한다.

import { currentMonthKey, dayKey, daysInMonth } from "@/lib/date";
import type { AppData, Subscription } from "@/lib/types";

const SEED_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "sub-netflix",
    serviceId: "netflix",
    planId: "netflix-premium",
    monthlyPrice: 17000,
    billingDay: 15,
  },
  {
    id: "sub-tving",
    serviceId: "tving",
    planId: "tving-standard",
    monthlyPrice: 13500,
    billingDay: 8,
  },
  {
    id: "sub-coupang-wow",
    serviceId: "coupang-wow",
    planId: "coupang-wow-basic",
    monthlyPrice: 7890,
    billingDay: 3,
  },
  {
    id: "sub-coupang-play",
    serviceId: "coupang-play",
    planId: "coupang-play-wow",
    monthlyPrice: 7890,
    billingDay: 3,
  },
  {
    id: "sub-youtube",
    serviceId: "youtube",
    planId: "youtube-premium",
    monthlyPrice: 14900,
    billingDay: 22,
  },
];

/** 구독별로 '이번 달 며칠에, 몇 분 썼는지' */
const SEED_USAGE: Record<string, [day: number, minutes: number][]> = {
  // 프리미엄(4K·4인)을 쓰는데 한 달에 네 번, 그것도 짧게 본다
  "sub-netflix": [
    [5, 45],
    [12, 60],
    [19, 40],
    [26, 55],
  ],
  // 한 번도 안 씀
  "sub-tving": [],
  // 주에 한 번씩 꾸준히
  "sub-coupang-wow": [
    [3, 10],
    [8, 15],
    [13, 10],
    [18, 20],
    [23, 10],
    [28, 15],
  ],
  // 거의 매일 길게 본다 (와우에 포함돼 있는데 따로 결제 중)
  "sub-coupang-play": [
    [1, 90],
    [2, 120],
    [4, 60],
    [5, 110],
    [7, 95],
    [8, 130],
    [10, 80],
    [11, 100],
    [13, 75],
    [14, 140],
    [16, 90],
    [17, 85],
    [19, 120],
    [20, 100],
    [22, 70],
    [23, 110],
    [25, 95],
    [26, 130],
    [28, 80],
    [29, 105],
  ],
  // 매일 조금씩
  "sub-youtube": [
    [1, 40],
    [2, 35],
    [3, 50],
    [4, 30],
    [6, 45],
    [7, 25],
    [8, 60],
    [9, 35],
    [10, 40],
    [11, 55],
    [13, 30],
    [14, 45],
    [15, 50],
    [16, 35],
    [17, 40],
    [18, 60],
    [20, 30],
    [21, 45],
    [22, 35],
    [23, 50],
    [24, 40],
    [25, 30],
    [27, 55],
    [28, 45],
    [29, 35],
    [30, 40],
  ],
};

function buildSeedData(): AppData {
  const month = currentMonthKey();
  const lastDay = daysInMonth(month);

  const usageLogs = SEED_SUBSCRIPTIONS.flatMap((subscription) =>
    (SEED_USAGE[subscription.id] ?? [])
      // 31일을 정해 뒀는데 그 달이 30일까지면 그 기록은 버린다
      .filter(([day]) => day <= lastDay)
      .map(([day, minutes]) => ({
        id: `seed-${subscription.id}-${day}`,
        subscriptionId: subscription.id,
        date: dayKey(month, day),
        minutes,
      })),
  );

  return {
    subscriptions: SEED_SUBSCRIPTIONS,
    usageLogs,
    monthlyCounts: [],
  };
}

export const SEED_DATA: AppData = buildSeedData();
