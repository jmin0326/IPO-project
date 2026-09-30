/** 숫자를 "13,500원" 형태로 바꾼다. */
export function won(amount: number): string {
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

/**
 * 앞 단어의 받침에 맞는 조사를 고른다.
 *
 *   particle("왓챠", "으로", "로")   -> "로"   (받침 없음)
 *   particle("넷플릭스", "으로", "로") -> "으로" (받침 있음)
 *
 * 서비스 이름이 데이터에서 오기 때문에 "왓챠(으)로"처럼 괄호를 쓰지 않으려면
 * 이렇게 골라 줘야 한다.
 *
 * 한글 음절은 유니코드에서 가~힣이 순서대로 놓여 있고,
 * (글자 - '가') % 28 이 0이면 받침이 없는 글자다.
 */
export function particle(word: string, withJong: string, withoutJong: string): string {
  const last = word.charCodeAt(word.length - 1);

  // 한글이 아닌 글자(영문·숫자·기호)로 끝나면 읽는 방식이 제각각이라
  // 더 흔한 쪽인 '받침 없음'으로 맞춘다. (예: "50GB" -> "지비로")
  if (Number.isNaN(last) || last < 0xac00 || last > 0xd7a3) return withoutJong;

  return (last - 0xac00) % 28 === 0 ? withoutJong : withJong;
}
