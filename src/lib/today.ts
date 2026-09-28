"use client";

// 앱이 '오늘'이라고 생각하는 날짜.
//
// 평소에는 진짜 오늘 날짜를 쓴다. 다만 시연하거나 화면을 확인할 때
// "결제일이 지난 뒤에는 어떻게 보이지?", "다음 달로 넘어가면?" 같은 걸
// 실제로 그날까지 기다려서 볼 수는 없다.
// 그래서 오늘 날짜를 손으로 옮길 수 있게 따로 빼 두었다.
//
// 구독·이용 기록 데이터(store.ts)와는 성격이 다른 '보기 설정'이라
// 저장 칸도 따로 쓴다. 나중에 Supabase로 옮길 때 같이 딸려가지 않게 하기 위해서다.

import { useSyncExternalStore } from "react";
import { todayKey } from "./date";

const STORAGE_KEY = "subscription-habit-today-override";

/** null이면 진짜 오늘을 쓴다는 뜻 */
let override: string | null = null;

const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  try {
    override = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    override = null;
  }
}

// 서버에서 미리 그릴 때 쓸 값. 한 번만 계산해서 고정해 둔다.
const SERVER_TODAY = todayKey();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): string {
  return override ?? todayKey();
}

function getServerSnapshot(): string {
  return SERVER_TODAY;
}

/** 앱이 오늘이라고 볼 날짜 ("YYYY-MM-DD") */
export function useToday(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** 날짜를 옮긴다. null을 넣으면 진짜 오늘로 되돌아간다. */
export function setToday(dateKey: string | null) {
  override = dateKey;
  try {
    if (dateKey === null) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, dateKey);
    }
  } catch {
    // 저장이 막혀 있어도 이번 화면에서는 동작하게 둔다.
  }
  listeners.forEach((listener) => listener());
}

/** 지금 날짜를 손으로 옮겨 둔 상태인지 */
export function isOverridden(): boolean {
  return override !== null && override !== todayKey();
}
