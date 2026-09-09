/** 숫자를 "13,500원" 형태로 바꾼다. */
export function won(amount: number): string {
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}
