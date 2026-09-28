// 처음 켰을 때 들어 있는 샘플 데이터.
//
// 계획서 5번에서 "발표 시연용으로 가상 사용자 샘플 로그를 미리 넣어 둔다"고
// 적은 것의 앞부분이다. 차시 7에서 Supabase에 넣을 샘플도 이 값을 그대로 쓴다.
//
// 날짜를 고정해 두면 다음 달에 열었을 때 달력이 텅 비어 보이므로,
// '이번 달 며칠'만 정해 두고 실제 날짜는 열 때 계산한다.

import { currentMonthKey, dayKey, daysInMonth } from "@/lib/date";
import type { AppData, Subscription } from "@/lib/types";

const SEED_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "sub-netflix",
    serviceId: "netflix",
    monthlyPrice: 17000, // 프리미엄 요금제를 쓰는 사람이라고 가정
    billingDay: 15,
  },
  { id: "sub-coupang", serviceId: "coupang-wow", monthlyPrice: 7890, billingDay: 3 },
  { id: "sub-youtube", serviceId: "youtube-premium", monthlyPrice: 14900, billingDay: 22 },
  { id: "sub-millie", serviceId: "millie", monthlyPrice: 11900, billingDay: 8 },
];

/** 구독별로 '이번 달 며칠에 썼는지' */
const SEED_USAGE_DAYS: Record<string, number[]> = {
  // 결제는 하는데 거의 안 보는 사람 (해지 1순위가 되도록)
  "sub-netflix": [6, 20],
  // 주에 한 번씩 꾸준히
  "sub-coupang": [3, 10, 17, 24],
  // 거의 매일 쓰는 사람 (1회당 비용이 가장 싸게 나옴)
  "sub-youtube": [
    1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24,
    25, 27, 28, 29, 30,
  ],
  // 한 번도 안 씀 (0으로 나누기 처리를 확인하기 위한 경우)
  "sub-millie": [],
};

function buildSeedData(): AppData {
  const month = currentMonthKey();
  const lastDay = daysInMonth(month);

  const usageLogs = SEED_SUBSCRIPTIONS.flatMap((subscription) =>
    (SEED_USAGE_DAYS[subscription.id] ?? [])
      // 31일을 정해 뒀는데 그 달이 30일까지면 그 기록은 버린다
      .filter((day) => day <= lastDay)
      .map((day) => ({
        id: `seed-${subscription.id}-${day}`,
        subscriptionId: subscription.id,
        date: dayKey(month, day),
      })),
  );

  return {
    subscriptions: SEED_SUBSCRIPTIONS,
    usageLogs,
    monthlyCounts: [],
  };
}

export const SEED_DATA: AppData = buildSeedData();
