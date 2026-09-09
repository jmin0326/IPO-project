// 화면 배치를 확인하기 위한 임시 데이터 (차시 2).
//
// 차시 3~4에서 사용자가 직접 등록·입력한 값으로 바뀌고,
// 차시 7에서 Supabase에서 불러온 데이터로 완전히 교체된다.

import type { Subscription } from "@/lib/types";

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "sub-1",
    serviceId: "netflix",
    monthlyPrice: 17000, // 프리미엄 요금제를 쓰는 사람이라고 가정
    billingDay: 15,
    usageCount: 2,
  },
  {
    id: "sub-2",
    serviceId: "coupang-wow",
    monthlyPrice: 7890,
    billingDay: 3,
    usageCount: 4,
  },
  {
    id: "sub-3",
    serviceId: "youtube-premium",
    monthlyPrice: 14900,
    billingDay: 22,
    usageCount: 26,
  },
  {
    id: "sub-4",
    serviceId: "millie",
    monthlyPrice: 11900,
    billingDay: 8,
    usageCount: 0, // 이번 달에 한 번도 안 쓴 경우 (0으로 나누기 확인용)
  },
];
