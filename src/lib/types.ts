// 앱에서 쓰는 데이터 모양(타입) 정의.
// 차시 6에서 Supabase 테이블을 만들 때 이 모양을 그대로 옮길 예정이라
// 필드 이름을 DB 컬럼 이름으로 바로 쓸 수 있게 잡아 두었다.

/**
 * 구독 정보 = "이 사용자가 이 서비스를 쓰고 있다"를 이어 주는 매칭 데이터.
 *
 * 계획서 5번에서 정한 대로, 사용자와 서비스를 직접 붙이지 않고
 * 이 구독 정보를 사이에 두어서 다대다 관계를 푼다.
 * (사용자 1명이 서비스 여러 개를, 서비스 1개를 사용자 여러 명이 구독할 수 있음)
 */
export type Subscription = {
  id: string;
  /** SERVICES 배열의 Service.id를 가리킨다. DB에서는 외래키가 된다. */
  serviceId: string;
  /** 사용자가 실제로 내는 월 요금(원). 서비스 기본 요금과 다를 수 있다. */
  monthlyPrice: number;
  /** 결제일 (매월 며칠) */
  billingDay: number;
};

/**
 * 이용 기록 한 줄. '이용함' 버튼이나 달력에서 하루씩 쌓인다.
 *
 * 이용 횟수는 이 기록을 세어서 구한다. 어딘가에 횟수를 따로 저장해 두면
 * 기록을 지웠을 때 숫자가 안 맞게 되므로, 횟수는 항상 이 기록에서 계산한다.
 */
export type UsageLog = {
  id: string;
  subscriptionId: string;
  /** 이용한 날짜. "YYYY-MM-DD" */
  date: string;
};

/**
 * 월 단위로 몰아서 입력한 이용 횟수.
 *
 * 계획서 2번의 두 번째 입력 방식("이번 달 몇 번 쓰셨나요?")에 해당한다.
 * 날짜를 하나하나 기억할 수 없는 사람을 위한 것이라 날짜 정보가 없다.
 *
 * 그래서 UsageLog와 따로 저장하고, 둘 다 있으면 이 값을 우선으로 쓴다.
 * (없는 날짜를 지어내서 UsageLog를 만드는 것은 거짓 데이터가 되기 때문)
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
