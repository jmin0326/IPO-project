"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * 지금 브라우저에서 그려지고 있는지 알려 준다.
 *
 * 이 앱은 '오늘 날짜'와 브라우저에 저장한 데이터를 보고 화면을 만든다.
 * 그런데 Next.js는 화면을 서버에서 미리 한 번 그려 두는데,
 * 서버에는 localStorage가 없고 시간대도 달라서 결과가 어긋날 수 있다.
 *
 * 그래서 서버에서는 false, 브라우저에서는 true를 돌려주게 해서
 * 날짜·저장 데이터에 기대는 화면은 브라우저에서만 그리도록 한다.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true, // 브라우저
    () => false, // 서버
  );
}
