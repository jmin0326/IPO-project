// 처음 켰을 때 들어 있는 샘플 데이터.
//
// 계획서 5번의 "발표 시연용 가상 사용자 샘플 로그"에 해당한다.
// 추천이 골고루 나오도록 일부러 서로 다른 습관을 가진 구독을 섞어 두었다.
//
//   넷플릭스 스탠다드 22회 -> 자주 봄. 영상은 여기에 몰려 있다
//   티빙     스탠다드  3회 -> 같은 영상인데 거의 안 봄  => 티빙 해지하고 넷플릭스에 몰아 쓰기
//   쿠팡 와우          6회 -> 유지
//   쿠팡플레이        20회 -> 와우에 포함돼 있는데 따로 결제 중  => 중복 결제
//   유튜브   프리미엄 26회 -> 유지 (대체재가 없어서 갈아타기 비교에서 빠진다)
//   스포티파이 베이직  2회 -> 거의 안 들음 + 네이버플러스로 받을 수 있는 요금제  => 해지 / 묶음
//
// 날짜를 고정해 두면 다음 달에 열었을 때 달력이 비어 보이므로
// '이번 달 며칠'만 정해 두고 실제 날짜는 열 때 계산한다.

import { currentMonthKey, dayKey, daysInMonth } from "@/lib/date";
import type { AppData, Subscription } from "@/lib/types";

const SEED_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "sub-netflix",
    serviceId: "netflix",
    planId: "netflix-standard",
    monthlyPrice: 13500,
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
  {
    id: "sub-spotify",
    serviceId: "spotify",
    planId: "spotify-basic",
    monthlyPrice: 8690,
    billingDay: 11,
  },
];

/** 구독별로 '이번 달 며칠에, 몇 분 썼는지' */
const SEED_USAGE: Record<string, [day: number, minutes: number][]> = {
  // 거의 매일 길게 본다
  "sub-netflix": [
    [1, 95],
    [2, 120],
    [3, 80],
    [5, 110],
    [6, 70],
    [7, 130],
    [8, 90],
    [10, 100],
    [11, 85],
    [12, 140],
    [13, 75],
    [15, 115],
    [16, 95],
    [17, 60],
    [19, 125],
    [20, 90],
    [21, 105],
    [22, 80],
    [24, 135],
    [25, 70],
    [26, 110],
    [27, 95],
  ],
  // 같은 영상인데 한 달에 세 번
  "sub-tving": [
    [9, 50],
    [18, 45],
    [28, 60],
  ],
  // 주에 한 번씩 꾸준히
  "sub-coupang-wow": [
    [3, 10],
    [8, 15],
    [13, 10],
    [18, 20],
    [23, 10],
    [28, 15],
  ],
  // 거의 매일 (와우에 포함돼 있는데 따로 결제 중)
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
  // 거의 안 들음
  "sub-spotify": [
    [4, 30],
    [20, 25],
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
