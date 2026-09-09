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
  /**
   * 이번 달 이용 횟수.
   *
   * 차시 4에서 사용자가 직접 입력받고,
   * 차시 7~8부터는 이용 기록(usage_logs) 테이블을 집계해서 채운다.
   */
  usageCount: number;
};

/**
 * 이용 기록 한 줄. (차시 4에서 '이용함' 버튼으로 쌓기 시작)
 *
 * 차시 2에서는 아직 안 쓰지만, 요일별 이용 패턴 그래프(차시 8)가
 * 이 데이터를 집계해서 그려질 예정이라 모양을 미리 적어 둔다.
 */
export type UsageLog = {
  id: string;
  subscriptionId: string;
  /** 이용 일시 (ISO 문자열) */
  usedAt: string;
  /** 이용 시간(분) */
  minutes: number;
};
