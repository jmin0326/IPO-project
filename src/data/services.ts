// 구독 서비스 목록 (차시 1 조사 결과)
//
// 조사 근거와 요금을 고른 이유는 docs/services-research.md 에 정리해 두었다.
// 새 서비스를 추가할 때는 아래 SERVICES 배열에 객체 하나만 넣으면 되고,
// 화면 코드는 고치지 않아도 된다. (계획서 5번 "코드 수정 없이 확장" 대비책)
//
// 차시 6~7에서 이 배열을 그대로 Supabase services 테이블로 옮긴다.
// 그래서 필드 이름도 DB 컬럼으로 바로 쓸 수 있게 잡아 두었다.

export type CategoryId = "ott" | "music" | "commerce" | "cloud" | "ai" | "book";

export type Category = {
  id: CategoryId;
  label: string;
};

export type Service = {
  /** DB로 옮길 때 기본키가 될 슬러그 */
  id: string;
  name: string;
  category: CategoryId;
  /** 월 요금(원). 웹 결제 · 1인 기준. 구독 등록 폼의 기본값으로만 쓴다. */
  defaultPrice: number;
  /** 대체 서비스로 추천할 때 보여 줄 장점 한 줄 */
  strength: string;
  /** 대체 서비스로 추천할 때 감안해야 할 단점 한 줄 */
  weakness: string;
};

export const CATEGORIES: Category[] = [
  { id: "ott", label: "영상 스트리밍" },
  { id: "music", label: "음악" },
  { id: "commerce", label: "쇼핑·배달 멤버십" },
  { id: "cloud", label: "클라우드 저장" },
  { id: "ai", label: "AI·생산성" },
  { id: "book", label: "독서" },
];

export const SERVICES: Service[] = [
  // ---- 영상 스트리밍 ----
  {
    id: "netflix",
    name: "넷플릭스",
    category: "ott",
    defaultPrice: 13500,
    strength: "오리지널과 해외 콘텐츠가 가장 많음",
    weakness: "요금이 비싼 편",
  },
  {
    id: "tving",
    name: "티빙",
    category: "ott",
    defaultPrice: 13500,
    strength: "국내 예능·드라마와 KBO 야구 중계",
    weakness: "해외 콘텐츠가 약함",
  },
  {
    id: "wavve",
    name: "웨이브",
    category: "ott",
    defaultPrice: 10900,
    strength: "지상파 실시간 방송과 구작 드라마",
    weakness: "오리지널 신작이 적음",
  },
  {
    id: "disney-plus",
    name: "디즈니+",
    category: "ott",
    defaultPrice: 9900,
    strength: "마블·픽사·스타워즈 독점 콘텐츠",
    weakness: "전체 콘텐츠 수가 적음",
  },
  {
    id: "watcha",
    name: "왓챠",
    category: "ott",
    defaultPrice: 7900,
    strength: "영화 큐레이션이 좋고 요금이 쌈",
    weakness: "콘텐츠 양이 적음",
  },
  {
    id: "coupang-play",
    name: "쿠팡플레이",
    category: "ott",
    defaultPrice: 7890,
    strength: "쿠팡 와우 멤버십에 포함, 스포츠 중계",
    weakness: "해외 콘텐츠가 적음",
  },

  // ---- 음악 ----
  {
    id: "youtube-premium",
    name: "유튜브 프리미엄",
    category: "music",
    defaultPrice: 14900,
    strength: "유튜브 광고 제거 + 유튜브 뮤직 포함",
    weakness: "음악 서비스 중 가장 비쌈",
  },
  {
    id: "youtube-music",
    name: "유튜브 뮤직",
    category: "music",
    defaultPrice: 11990,
    strength: "유튜브에 올라온 음원까지 전부 들을 수 있음",
    weakness: "유튜브 영상 광고는 그대로 나옴",
  },
  {
    id: "spotify",
    name: "스포티파이",
    category: "music",
    // 프리미엄 개인 요금제. 오디오북이 빠진 '베이직'은 8,690원, 학생은 6,600원.
    defaultPrice: 11990,
    strength: "추천 알고리즘과 해외 음원이 강함",
    weakness: "일부 국내 음원이 빠져 있음",
  },
  {
    id: "melon",
    name: "멜론",
    category: "music",
    // 스트리밍 클럽 정기결제(PC+모바일). 모바일 전용은 7,590원.
    defaultPrice: 8690,
    strength: "국내 음원과 차트가 가장 충실함",
    weakness: "해외 음원과 추천 기능은 약한 편",
  },
  {
    id: "youtube-premium-lite",
    name: "유튜브 프리미엄 라이트",
    category: "music",
    defaultPrice: 8500,
    strength: "광고만 없애면 되는 사람에게 저렴",
    weakness: "백그라운드 재생과 유튜브 뮤직이 빠짐",
  },
  {
    id: "flo",
    name: "플로",
    category: "music",
    // PC+모바일 무제한 정기결제. 모바일 전용은 6,900원.
    defaultPrice: 7900,
    strength: "SKT 결합 할인이 큼",
    weakness: "이용자가 적어 추천 데이터가 약함",
  },

  // ---- 쇼핑·배달 멤버십 ----
  {
    id: "coupang-wow",
    name: "쿠팡 와우",
    category: "commerce",
    defaultPrice: 7890,
    strength: "로켓배송 무료 + 쿠팡플레이 포함",
    weakness: "쿠팡에서만 쓸 수 있고 요금이 계속 올랐음",
  },
  {
    id: "naver-plus",
    name: "네이버플러스",
    category: "commerce",
    defaultPrice: 4900,
    strength: "쇼핑 적립에 넷플릭스·스포티파이 등 콘텐츠 하나를 골라 받음",
    weakness: "적립 포인트는 네이버에서만 쓸 수 있음",
  },
  {
    id: "baemin-club",
    name: "배민클럽",
    category: "commerce",
    defaultPrice: 3990,
    strength: "배민 주문 무료배달",
    weakness: "배달의민족 주문에만 쓸모 있음",
  },
  {
    id: "kurly-members",
    name: "컬리멤버스",
    category: "commerce",
    defaultPrice: 1900,
    strength: "월 회비가 가장 싸고 무료배송·적립",
    weakness: "컬리를 자주 쓰지 않으면 의미 없음",
  },

  // ---- 클라우드 저장 ----
  {
    id: "google-one",
    name: "구글 원 (100GB)",
    category: "cloud",
    defaultPrice: 2400,
    strength: "구글 포토·드라이브·지메일 용량을 함께 씀",
    weakness: "사진이 많으면 100GB로 부족",
  },
  {
    id: "icloud",
    name: "iCloud+ (50GB)",
    category: "cloud",
    defaultPrice: 1100,
    strength: "아이폰 백업이 자동으로 되고 가장 저렴",
    weakness: "애플 기기 위주로만 쓸모 있음",
  },

  // ---- AI·생산성 ----
  {
    id: "chatgpt-plus",
    name: "챗GPT Plus",
    category: "ai",
    defaultPrice: 29000,
    strength: "최신 모델과 이미지·데이터 분석",
    weakness: "달러 결제라 환율에 따라 금액이 바뀜",
  },
  {
    id: "claude-pro",
    name: "클로드 Pro",
    category: "ai",
    defaultPrice: 29000,
    strength: "긴 문서 읽기와 코드 작성에 강함",
    weakness: "달러 결제라 환율에 따라 금액이 바뀜",
  },

  // ---- 독서 ----
  {
    id: "millie",
    name: "밀리의서재",
    category: "book",
    defaultPrice: 11900,
    strength: "전자책과 오디오북 무제한",
    weakness: "원하는 신간이 없을 수 있음",
  },
];

/** id로 서비스 하나 찾기. 없으면 undefined. */
export function findService(id: string): Service | undefined {
  return SERVICES.find((service) => service.id === id);
}

/** 카테고리 id로 이름 얻기 (예: "ott" -> "영상 스트리밍") */
export function categoryLabel(id: CategoryId): string {
  return CATEGORIES.find((category) => category.id === id)?.label ?? id;
}
