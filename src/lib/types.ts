// 앱에서 쓰는 데이터 모양(타입) 정의.
// 차시 6에서 Supabase 테이블을 만들 때 이 모양을 그대로 옮길 예정이라
// 필드 이름을 DB 컬럼 이름으로 바로 쓸 수 있게 잡아 두었다.

/**
 * 구독 정보 = "이 사용자가 이 서비스를, 이 요금제로 쓰고 있다"를 잇는 매칭 데이터.
 *
 * 계획서 5번에서 정한 대로, 사용자와 서비스를 직접 붙이지 않고
 * 이 구독 정보를 사이에 두어서 다대다 관계를 푼다.
 */
export type Subscription = {
  id: string;
  /** SERVICES의 Service.id */
  serviceId: string;
  /** 그 서비스 안의 Plan.id. 어떤 요금제를 쓰는지 알아야 낮추기·올리기를 추천할 수 있다. */
  planId: string;
  /** 사용자가 실제로 내는 월 요금(원). 할인받으면 요금제 정가와 다를 수 있다. */
  monthlyPrice: number;
  /** 결제일 (매월 며칠) */
  billingDay: number;
};

/**
 * 이용 기록 한 줄. 달력에서 하루씩 쌓인다.
 *
 * 이용 횟수는 이 기록을 세어서 구한다. 횟수를 따로 저장해 두면
 * 기록을 지웠을 때 숫자가 안 맞게 되므로 항상 여기서 계산한다.
 */
export type UsageLog = {
  id: string;
  subscriptionId: string;
  /** 이용한 날짜. "YYYY-MM-DD" */
  date: string;
  /**
   * 그날 쓴 시간(분). 0이면 "썼지만 몇 분인지는 안 적음".
   *
   * 계획서 Input에 원래 있던 항목이다. 같은 월 4회라도 한 번에 3시간씩 보는 사람과
   * 10분씩 보는 사람은 전혀 달라서, 요금제를 낮추라고 할지 판단하는 데 쓴다.
   */
  minutes: number;
};

/**
 * 월 단위로 몰아서 입력한 이용 횟수.
 *
 * 계획서 2번의 두 번째 입력 방식("이번 달 몇 번 쓰셨나요?")에 해당한다.
 * 날짜를 하나하나 기억할 수 없는 사람을 위한 것이라 날짜 정보가 없다.
 * 그래서 UsageLog와 따로 저장하고, 둘 다 있으면 이 값을 우선으로 쓴다.
 */
export type MonthlyCount = {
  id: string;
  subscriptionId: string;
  /** "YYYY-MM" */
  month: string;
  count: number;
};

/** 앱이 들고 있는 데이터 전체 */
export type AppData = {
  subscriptions: Subscription[];
  usageLogs: UsageLog[];
  monthlyCounts: MonthlyCount[];
};
