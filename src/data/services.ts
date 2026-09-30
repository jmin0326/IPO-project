// 구독 서비스 목록과 요금제.
//
// 조사 근거는 docs/services-research.md 에 정리해 두었다.
// 새 서비스는 아래 SERVICES 배열에 객체 하나만 추가하면 되고,
// 새 요금제는 그 서비스의 plans 배열에 한 줄만 추가하면 된다. 화면 코드는 안 고친다.
//
// 요금제마다 광고·화질·동시접속·오프라인 저장을 같이 저장하는 이유:
// "요금제를 낮추세요"라고만 하면 사용자가 뭘 잃는지 알 수 없다.
// 낮췄을 때 포기해야 하는 것을 같이 보여 주려고 스펙을 함께 들고 있는다.

export type CategoryId = "ott" | "music" | "commerce" | "ai";

export type Category = {
  id: CategoryId;
  label: string;
  /**
   * 달력에서 이용 기록 점을 찍을 때 쓰는 색.
   * 서비스마다 색을 정하면 서비스를 추가할 때마다 색을 골라야 해서
   * 개수가 고정된 카테고리에만 색을 둔다.
   */
  color: string;
};

export type Plan = {
  id: string;
  name: string;
  /** 월 요금(원). 웹 결제 · 1인 기준 */
  price: number;
  /** 광고가 붙는 요금제인지 */
  ads: boolean;
  /** 화질·음질을 사람이 읽는 말로. 확인 못 했으면 비워 둔다. */
  quality?: string;
  /** 화질·음질 비교용 숫자(클수록 좋음). 확인 못 했으면 비워 둔다. */
  qualityRank?: number;
  /** 동시에 쓸 수 있는 기기 수. 확인 못 했으면 비워 둔다. */
  devices?: number;
  /** 오프라인 저장(다운로드) 가능 여부. 확인 못 했으면 비워 둔다. */
  offline?: boolean;
  /** 이 요금제만의 조건이나 주의점 */
  note?: string;
};

export type Service = {
  id: string;
  name: string;
  category: CategoryId;
  /** 요금이 싼 순서로 둔다. */
  plans: Plan[];
  /** 구독 등록 폼에서 미리 골라 줄 요금제 */
  defaultPlanId: string;
  /**
   * 얼마나 널리 쓰이는지 (1~5).
   *
   * "콘텐츠가 더 많은 서비스로 갈아타세요"를 판단하는 근거인데,
   * 각 서비스의 보유 작품 수는 어디에도 공개돼 있지 않다.
   * 그래서 실제로 측정된 숫자인 '국내 월간 이용자 수(MAU)'를 대신 쓴다.
   *
   * 주의: 이건 인기이지 콘텐츠 양이 아니다. 왓챠처럼 독립·예술영화가 강한
   * 서비스는 "콘텐츠가 적다"기보다 "취향이 다르다"가 맞다.
   * 그래서 화면 문구도 '콘텐츠가 많은'이 아니라 '더 폭넓게 쓰이는'으로 쓴다.
   *
   * MAU를 못 찾은 카테고리(쇼핑·AI)는 비워 두고, 그 경우 갈아타기 추천을 하지 않는다.
   */
  reach?: number;
  /** reach를 그렇게 매긴 근거 */
  reachNote?: string;
  /**
   * 다른 서비스로 갈아타기 추천을 할 수 있는 서비스인지. 기본은 true.
   *
   * false면 이 서비스에 대해 갈아타기를 추천하지도 않고,
   * 다른 서비스의 대안으로 제시되지도 않는다. (양방향 제외)
   *
   * 유튜브가 그런 경우다. 넷플릭스는 '콘텐츠를 사는 것'이지만
   * 유튜브 프리미엄은 '이미 공짜로 보는 콘텐츠에서 불편함만 없애는 것'이라
   * 대신 쓸 수 있는 서비스가 구조적으로 존재하지 않는다.
   */
  switchable?: boolean;
  /** switchable이 false일 때 화면에 보여 줄 이유 */
  switchNote?: string;
  /**
   * 카테고리 기준 대신 이 서비스에만 쓸 이용 강도 기준.
   *
   * 같은 영상 서비스라도 유튜브는 거의 매일 쓰는 게 보통이라,
   * 다른 OTT와 같은 기준(월 8회부터 '자주')을 대면 항상 '자주 씀'이 되어
   * 판정이 의미가 없어진다.
   */
  intensityLimits?: { low: number; medium: number; note: string };
  /** 대체 서비스로 추천할 때 보여 줄 장점 한 줄 */
  strength: string;
  /** 대체 서비스로 추천할 때 감안해야 할 단점 한 줄 */
  weakness: string;
};

export const CATEGORIES: Category[] = [
  { id: "ott", label: "영상 스트리밍", color: "#d9534f" },
  { id: "music", label: "음악", color: "#4a7fd4" },
  { id: "commerce", label: "쇼핑·배달 멤버십", color: "#dd8534" },
  { id: "ai", label: "AI·생산성", color: "#7f5fc9" },
];

export const SERVICES: Service[] = [
  // ---------- 영상 스트리밍 ----------
  {
    id: "netflix",
    name: "넷플릭스",
    category: "ott",
    defaultPlanId: "netflix-standard",
    reach: 5,
    reachNote: "국내 월간 이용자 1,490만 (2026.2)",
    strength: "오리지널과 해외 콘텐츠가 가장 많음",
    weakness: "요금이 비싼 편",
    plans: [
      {
        id: "netflix-ads",
        name: "광고형 스탠다드",
        price: 7000,
        ads: true,
        quality: "1080p",
        qualityRank: 2,
        devices: 2,
        offline: true,
      },
      {
        id: "netflix-standard",
        name: "스탠다드",
        price: 13500,
        ads: false,
        quality: "1080p",
        qualityRank: 2,
        devices: 2,
        offline: true,
      },
      {
        id: "netflix-premium",
        name: "프리미엄",
        price: 17000,
        ads: false,
        quality: "4K + HDR",
        qualityRank: 3,
        devices: 4,
        offline: true,
      },
    ],
  },
  {
    id: "coupang-play",
    name: "쿠팡플레이",
    category: "ott",
    defaultPlanId: "coupang-play-wow",
    reach: 4,
    reachNote: "국내 월간 이용자 879만 (2026.2)",
    strength: "쿠팡 와우 멤버십에 포함, 스포츠 중계",
    weakness: "해외 콘텐츠가 적음",
    plans: [
      {
        id: "coupang-play-wow",
        name: "와우 멤버십 포함",
        price: 7890,
        ads: false,
        note: "따로 파는 요금제가 없고 쿠팡 와우 멤버십에 들어 있다",
      },
    ],
  },
  {
    id: "tving",
    name: "티빙",
    category: "ott",
    defaultPlanId: "tving-standard",
    reach: 3,
    reachNote: "국내 월간 이용자 552만 (2026.2)",
    strength: "국내 예능·드라마와 KBO 야구 중계",
    weakness: "해외 콘텐츠가 약함",
    plans: [
      {
        id: "tving-ads",
        name: "광고형 스탠다드",
        price: 5500,
        ads: true,
        quality: "1080p",
        qualityRank: 2,
        devices: 2,
        offline: true,
        note: "다운로드는 월 15회까지",
      },
      {
        id: "tving-basic",
        name: "베이직",
        price: 9500,
        ads: false,
        quality: "1080p",
        qualityRank: 2,
        devices: 1,
        offline: true,
      },
      {
        id: "tving-standard",
        name: "스탠다드",
        price: 13500,
        ads: false,
        quality: "1080p (일부 4K)",
        qualityRank: 2,
        devices: 2,
        offline: true,
      },
      {
        id: "tving-premium",
        name: "프리미엄",
        price: 17000,
        ads: false,
        quality: "1080p (일부 4K)",
        qualityRank: 2,
        devices: 4,
        offline: true,
      },
    ],
  },
  {
    id: "disney-plus",
    name: "디즈니+",
    category: "ott",
    defaultPlanId: "disney-standard",
    reach: 3,
    reachNote: "국내 월간 이용자 295만 (2026.2)",
    strength: "마블·픽사·스타워즈 독점 콘텐츠",
    weakness: "전체 콘텐츠 수가 적음",
    plans: [
      {
        id: "disney-standard",
        name: "스탠다드",
        price: 9900,
        ads: false,
        quality: "1080p",
        qualityRank: 2,
        devices: 2,
        offline: true,
      },
      {
        id: "disney-premium",
        name: "프리미엄",
        price: 13900,
        ads: false,
        quality: "4K + HDR",
        qualityRank: 3,
        devices: 4,
        offline: true,
      },
    ],
  },
  {
    id: "wavve",
    name: "웨이브",
    category: "ott",
    defaultPlanId: "wavve-standard",
    reach: 2,
    reachNote: "국내 월간 이용자 212만 (2026.2)",
    strength: "지상파 실시간 방송과 구작 드라마",
    weakness: "오리지널 신작이 적음",
    plans: [
      {
        id: "wavve-ads",
        name: "광고형 스탠다드",
        price: 5500,
        ads: true,
        quality: "1080p",
        qualityRank: 2,
        devices: 2,
        offline: true,
      },
      {
        id: "wavve-basic",
        name: "베이직",
        price: 7900,
        ads: false,
        quality: "720p",
        qualityRank: 1,
        devices: 1,
        offline: true,
        note: "광고형보다 비싼데 화질과 동시접속은 더 낮다",
      },
      {
        id: "wavve-standard",
        name: "스탠다드",
        price: 10900,
        ads: false,
        quality: "1080p",
        qualityRank: 2,
        devices: 2,
        offline: true,
      },
      {
        id: "wavve-premium",
        name: "프리미엄",
        price: 13900,
        ads: false,
        quality: "4K + HDR",
        qualityRank: 3,
        devices: 4,
        offline: true,
      },
    ],
  },
  {
    id: "watcha",
    name: "왓챠",
    category: "ott",
    defaultPlanId: "watcha-basic",
    reach: 1,
    reachNote: "국내 월간 이용자 35만 (2026.2)",
    strength: "영화 큐레이션이 좋고 요금이 쌈",
    weakness: "이용자가 가장 적고 최신 대중 콘텐츠가 약함",
    plans: [
      {
        id: "watcha-basic",
        name: "베이직",
        price: 7900,
        ads: false,
        quality: "1080p",
        qualityRank: 2,
        devices: 1,
        offline: true,
        note: "오프라인 저장 5개까지",
      },
      {
        id: "watcha-premium",
        name: "프리미엄",
        price: 12900,
        ads: false,
        quality: "4K + HDR10+",
        qualityRank: 3,
        devices: 4,
        offline: true,
        note: "오프라인 저장 100개까지",
      },
    ],
  },

  // 유튜브는 프리미엄·라이트·뮤직을 한 서비스의 요금제로 묶었다.
  // 따로 두면 "프리미엄에서 라이트로 낮추세요"라는 추천이 나올 수 없기 때문이다.
  //
  // 카테고리는 영상 스트리밍이다. 유튜브 프리미엄의 핵심은 '유튜브 영상 광고 제거'이고
  // 유튜브는 영상 서비스이기 때문이다.
  // 다만 다른 OTT와 성격이 달라서 예외를 두 개 달아 두었다. (switchable, intensityLimits)
  {
    id: "youtube",
    name: "유튜브",
    category: "ott",
    defaultPlanId: "youtube-premium",
    switchable: false,
    switchNote:
      "유튜브 프리미엄은 이미 공짜로 보는 유튜브에서 광고만 없애는 서비스라, 대신 쓸 수 있는 다른 서비스가 없습니다. 그래서 갈아타기는 추천하지 않고 요금제만 비교합니다",
    intensityLimits: {
      low: 5,
      medium: 15,
      note: "유튜브는 거의 매일 쓰는 사람이 많아 다른 영상 서비스보다 기준을 높게 잡았다",
    },
    strength: "영상 광고 제거와 음악을 한 번에 해결",
    weakness: "구독 서비스 중 비싼 편",
    plans: [
      {
        id: "youtube-lite",
        name: "프리미엄 라이트",
        price: 8500,
        ads: false,
        offline: true,
        note: "유튜브 뮤직이 빠지고, 음악 영상에는 광고가 그대로 나온다",
      },
      {
        id: "youtube-music",
        name: "유튜브 뮤직",
        price: 11990,
        ads: true,
        offline: true,
        note: "음악만 해결된다. 유튜브 영상 광고는 제거되지 않는다",
      },
      {
        id: "youtube-premium",
        name: "프리미엄",
        price: 14900,
        ads: false,
        offline: true,
        note: "영상 광고 제거 + 유튜브 뮤직 포함",
      },
    ],
  },
  // ---------- 음악 ----------
  {
    id: "melon",
    name: "멜론",
    category: "music",
    defaultPlanId: "melon-streaming",
    reach: 4,
    reachNote: "국내 월간 이용자 634만 (2026.1)",
    strength: "국내 음원과 차트가 가장 충실함",
    weakness: "해외 음원과 추천 기능은 약한 편",
    plans: [
      {
        id: "melon-mobile",
        name: "모바일 스트리밍클럽",
        price: 7590,
        ads: false,
        quality: "표준 음질",
        qualityRank: 2,
        offline: false,
        note: "휴대폰에서만 들을 수 있다",
      },
      {
        id: "melon-streaming",
        name: "스트리밍클럽",
        price: 8690,
        ads: false,
        quality: "표준 음질",
        qualityRank: 2,
        offline: false,
        note: "PC·태블릿에서도 들을 수 있다",
      },
      {
        id: "melon-plus",
        name: "스트리밍 플러스",
        price: 11990,
        ads: false,
        quality: "표준 음질",
        qualityRank: 2,
        offline: true,
        note: "오프라인 재생은 인증한 휴대폰 1대에서만",
      },
      {
        id: "melon-hifi",
        name: "Hi-Fi 스트리밍클럽",
        price: 13200,
        ads: false,
        quality: "FLAC 고음질",
        qualityRank: 3,
        offline: false,
      },
    ],
  },
  {
    id: "spotify",
    name: "스포티파이",
    category: "music",
    defaultPlanId: "spotify-individual",
    reach: 3,
    reachNote: "국내 월간 이용자 385만 (2026.1)",
    strength: "추천 알고리즘과 해외 음원이 강함",
    weakness: "일부 국내 음원이 빠져 있음",
    plans: [
      {
        id: "spotify-student",
        name: "학생",
        price: 6600,
        ads: false,
        quality: "무손실",
        qualityRank: 3,
        offline: true,
        note: "대학 재학 인증이 필요하고 최대 4년까지",
      },
      {
        id: "spotify-basic",
        name: "베이직",
        price: 8690,
        ads: false,
        quality: "표준 음질",
        qualityRank: 2,
        offline: false,
        note: "오프라인 저장이 안 된다",
      },
      {
        id: "spotify-individual",
        name: "개인",
        price: 11990,
        ads: false,
        quality: "무손실",
        qualityRank: 3,
        offline: true,
      },
      {
        id: "spotify-duo",
        name: "듀오",
        price: 17985,
        ads: false,
        quality: "무손실",
        qualityRank: 3,
        devices: 2,
        offline: true,
        note: "같은 주소지에 사는 2명만 쓸 수 있다",
      },
    ],
  },
  {
    id: "flo",
    name: "플로",
    category: "music",
    defaultPlanId: "flo-all",
    reach: 2,
    reachNote: "국내 월간 이용자 173만 (2026.1)",
    strength: "SKT 결합 할인이 큼",
    weakness: "이용자가 적어 추천 데이터가 약함",
    plans: [
      {
        id: "flo-mobile",
        name: "모바일 무제한",
        price: 6900,
        ads: false,
        quality: "표준 음질",
        qualityRank: 2,
        offline: false,
        note: "휴대폰에서만 들을 수 있다",
      },
      {
        id: "flo-all",
        name: "PC + 모바일 무제한",
        price: 7900,
        ads: false,
        quality: "표준 음질",
        qualityRank: 2,
        offline: false,
      },
      {
        id: "flo-offline",
        name: "무제한 + 오프라인",
        price: 10900,
        ads: false,
        quality: "표준 음질",
        qualityRank: 2,
        offline: true,
      },
    ],
  },

  // ---------- 쇼핑·배달 멤버십 ----------
  // MAU 자료를 못 찾아서 reach를 비워 두었다. 그래서 이 카테고리에서는
  // "더 폭넓게 쓰이는 서비스로 갈아타기" 추천이 나오지 않는다.
  {
    id: "coupang-wow",
    name: "쿠팡 와우",
    category: "commerce",
    defaultPlanId: "coupang-wow-basic",
    strength: "로켓배송 무료 + 쿠팡플레이 포함",
    weakness: "쿠팡에서만 쓸 수 있고 요금이 계속 올랐음",
    plans: [{ id: "coupang-wow-basic", name: "와우 멤버십", price: 7890, ads: false }],
  },
  {
    id: "naver-plus",
    name: "네이버플러스",
    category: "commerce",
    defaultPlanId: "naver-plus-monthly",
    strength: "쇼핑 적립에 넷플릭스·스포티파이 등 콘텐츠 하나를 골라 받음",
    weakness: "적립 포인트는 네이버에서만 쓸 수 있음",
    plans: [
      {
        id: "naver-plus-yearly",
        name: "연간 결제",
        price: 3900,
        ads: false,
        note: "연 46,800원을 한 번에 낸다 (월로 나누면 3,900원)",
      },
      { id: "naver-plus-monthly", name: "월간 결제", price: 4900, ads: false },
    ],
  },
  {
    id: "baemin-club",
    name: "배민클럽",
    category: "commerce",
    defaultPlanId: "baemin-club-basic",
    strength: "배민 주문 무료배달",
    weakness: "배달의민족 주문에만 쓸모 있음",
    plans: [{ id: "baemin-club-basic", name: "정가", price: 3990, ads: false }],
  },
  {
    id: "kurly-members",
    name: "컬리멤버스",
    category: "commerce",
    defaultPlanId: "kurly-members-basic",
    strength: "월 회비가 가장 싸고 무료배송·적립",
    weakness: "컬리를 자주 쓰지 않으면 의미 없음",
    plans: [{ id: "kurly-members-basic", name: "멤버스", price: 1900, ads: false }],
  },

  // ---------- AI·생산성 ----------
  {
    id: "chatgpt-plus",
    name: "챗GPT Plus",
    category: "ai",
    defaultPlanId: "chatgpt-plus-basic",
    strength: "최신 모델과 이미지·데이터 분석",
    weakness: "달러 결제라 환율에 따라 금액이 바뀜",
    plans: [
      {
        id: "chatgpt-plus-basic",
        name: "Plus",
        price: 29000,
        ads: false,
        note: "미국 달러 $20을 환산한 대략값이라 정확하지 않다",
      },
    ],
  },
  {
    id: "claude-pro",
    name: "클로드 Pro",
    category: "ai",
    defaultPlanId: "claude-pro-basic",
    strength: "긴 문서 읽기와 코드 작성에 강함",
    weakness: "달러 결제라 환율에 따라 금액이 바뀜",
    plans: [
      {
        id: "claude-pro-basic",
        name: "Pro",
        price: 29000,
        ads: false,
        note: "미국 달러 $20을 환산한 대략값이라 정확하지 않다",
      },
    ],
  },
];

// ---- 찾기 도우미 ----

export function findService(id: string): Service | undefined {
  return SERVICES.find((service) => service.id === id);
}

export function serviceName(serviceId: string): string {
  return findService(serviceId)?.name ?? serviceId;
}

/** 서비스 안에서 요금제 하나를 찾는다. */
export function findPlan(serviceId: string, planId: string): Plan | undefined {
  return findService(serviceId)?.plans.find((plan) => plan.id === planId);
}

/** 구독 등록 폼에서 미리 골라 줄 요금제 */
export function defaultPlanOf(service: Service): Plan {
  return (
    service.plans.find((plan) => plan.id === service.defaultPlanId) ?? service.plans[0]
  );
}

/** 서비스의 기본 요금 (다른 서비스와 값을 비교할 때 쓴다) */
export function defaultPriceOf(service: Service): number {
  return defaultPlanOf(service).price;
}

/**
 * 금액만 알고 요금제를 모를 때, 금액이 가장 가까운 요금제를 고른다.
 * (요금제를 저장하기 전에 등록해 둔 구독을 살릴 때 쓴다)
 */
export function guessPlan(serviceId: string, monthlyPrice: number): Plan | undefined {
  const service = findService(serviceId);
  if (!service) return undefined;

  return [...service.plans].sort(
    (a, b) => Math.abs(a.price - monthlyPrice) - Math.abs(b.price - monthlyPrice),
  )[0];
}

export function categoryLabel(id: CategoryId): string {
  return CATEGORIES.find((category) => category.id === id)?.label ?? id;
}

export function categoryColor(id: CategoryId): string {
  return CATEGORIES.find((category) => category.id === id)?.color ?? "#9aa0a6";
}

export function serviceColor(serviceId: string): string {
  const service = findService(serviceId);
  return service ? categoryColor(service.category) : "#9aa0a6";
}
