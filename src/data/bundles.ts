// 묶음 상품 — "이 멤버십을 쓰면 저 서비스가 딸려온다"는 관계.
//
// 구독을 하나씩 따로만 보면 절대 못 찾는 낭비가 있다.
// 쿠팡 와우를 쓰면서 쿠팡플레이를 따로 결제하는 경우가 대표적이다.
// 이 표가 있어야 중복을 잡아내고 묶음 상품을 제안할 수 있다.
//
// 새 묶음은 배열에 한 줄만 추가하면 된다.

export type Bundle = {
  id: string;
  /** 사람이 읽는 이름 */
  name: string;
  /** 이 서비스를 구독하고 있으면 */
  hostServiceId: string;
  /** 아래 서비스들이 딸려온다 */
  includedServiceIds: string[];
  /**
   * 딸려오는 것 중 하나만 고를 수 있는지.
   * true면 "넷플릭스 아니면 스포티파이 중 하나"라는 뜻이다.
   */
  chooseOne: boolean;
  /** 딸려오는 서비스가 특정 요금제로 제한되면 적어 둔다. */
  includedPlanIds?: Record<string, string>;
  note: string;
};

export const BUNDLES: Bundle[] = [
  {
    id: "coupang-wow-play",
    name: "쿠팡 와우",
    hostServiceId: "coupang-wow",
    includedServiceIds: ["coupang-play"],
    chooseOne: false,
    note: "쿠팡 와우 멤버십에 쿠팡플레이가 들어 있어서 따로 낼 필요가 없다",
  },
  {
    id: "naver-plus-contents",
    name: "네이버플러스 멤버십",
    hostServiceId: "naver-plus",
    includedServiceIds: ["netflix", "spotify"],
    chooseOne: true,
    includedPlanIds: {
      netflix: "netflix-ads",
      spotify: "spotify-basic",
    },
    note: "월 4,900원에 넷플릭스 광고형·스포티파이 베이직·티빙 중 하나를 고를 수 있다",
  },
];

/** 이 서비스를 품고 있는 묶음들 */
export function bundlesIncluding(serviceId: string): Bundle[] {
  return BUNDLES.filter((bundle) => bundle.includedServiceIds.includes(serviceId));
}
