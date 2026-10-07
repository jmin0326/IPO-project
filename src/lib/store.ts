"use client";

// 앱 데이터를 한곳에 모아 두는 곳 (차시 3~5용 임시 저장소).
//
// 아직 서버·DB가 없어서 브라우저의 localStorage에 저장한다.
// 새로고침해도 입력한 내용이 남지만, 다른 기기에서는 안 보인다.
// 차시 7에서 아래 함수들의 '속'만 Supabase 호출로 바꾸면 화면 코드는
// 거의 고치지 않아도 되도록, 데이터를 만지는 코드를 전부 이 파일에 모아 두었다.

import { useSyncExternalStore } from "react";
import { SEED_DATA } from "@/data/seed";
import type { AppData, MonthlyCount, Subscription, UsageLog } from "./types";

// 요금제(planId)와 이용 시간(minutes)이 생기면서 데이터 모양이 바뀌었다.
// 예전 모양으로 저장된 값을 그대로 읽으면 화면이 깨지므로 칸 이름을 v2로 올린다.
const STORAGE_KEY = "subscription-habit-v2";

/** 지금 들고 있는 데이터. 이 파일 밖에서는 직접 못 건드린다. */
let state: AppData = SEED_DATA;

/** 데이터가 바뀌면 다시 그려야 하는 화면들 */
const listeners = new Set<() => void>();

function loadFromStorage(): AppData | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AppData>;
    // 저장된 값이 우리가 아는 모양인지 최소한만 확인한다.
    if (!Array.isArray(parsed.subscriptions)) return null;

    return {
      subscriptions: parsed.subscriptions,
      usageLogs: Array.isArray(parsed.usageLogs) ? parsed.usageLogs : [],
      monthlyCounts: Array.isArray(parsed.monthlyCounts) ? parsed.monthlyCounts : [],
    };
  } catch {
    // 저장된 값이 깨졌으면 조용히 샘플 데이터로 시작한다.
    return null;
  }
}

// 브라우저에서 이 파일이 처음 불릴 때 한 번만 저장된 값을 읽어 온다.
if (typeof window !== "undefined") {
  state = loadFromStorage() ?? SEED_DATA;
}

function setData(next: AppData) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 저장 공간이 꽉 찼거나 막혀 있어도 화면은 계속 돌아가게 둔다.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AppData {
  return state;
}

function getServerSnapshot(): AppData {
  // 서버에서 미리 그릴 때는 localStorage를 볼 수 없으니 샘플 데이터를 쓴다.
  return SEED_DATA;
}

/** 화면에서 데이터를 읽을 때 쓰는 훅. 데이터가 바뀌면 자동으로 다시 그려진다. */
export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

// ---- 구독 ----

export function addSubscription(input: Omit<Subscription, "id">) {
  const subscription: Subscription = { ...input, id: newId("sub") };
  setData({ ...state, subscriptions: [...state.subscriptions, subscription] });
}

/** 같은 서비스 안에서 요금제만 바꾼다. (상세 화면의 '요금제 낮추기/올리기') */
export function changeSubscriptionPlan(
  subscriptionId: string,
  planId: string,
  monthlyPrice: number,
) {
  setData({
    ...state,
    subscriptions: state.subscriptions.map((subscription) =>
      subscription.id === subscriptionId
        ? { ...subscription, planId, monthlyPrice }
        : subscription,
    ),
  });
}

/**
 * 같은 구독을 다른 서비스로 갈아탄다. (상세 화면의 '서비스 변경')
 *
 * 이용 기록은 그대로 둔다. 사람이 하던 일(영상 보기)은 그대로고 수단만 바뀐 것이라,
 * 지금까지 쌓인 이용 패턴은 살리는 편이 맞다고 봤다.
 */
export function changeSubscriptionService(
  subscriptionId: string,
  serviceId: string,
  planId: string,
  monthlyPrice: number,
) {
  setData({
    ...state,
    subscriptions: state.subscriptions.map((subscription) =>
      subscription.id === subscriptionId
        ? { ...subscription, serviceId, planId, monthlyPrice }
        : subscription,
    ),
  });
}

/** 구독을 지우면 거기에 딸린 이용 기록과 몰아 입력도 같이 지운다. */
export function removeSubscription(subscriptionId: string) {
  setData({
    subscriptions: state.subscriptions.filter((item) => item.id !== subscriptionId),
    usageLogs: state.usageLogs.filter((log) => log.subscriptionId !== subscriptionId),
    monthlyCounts: state.monthlyCounts.filter(
      (item) => item.subscriptionId !== subscriptionId,
    ),
  });
}

// ---- 이용 기록 ----

/** 같은 날 같은 구독을 여러 번 눌러도 기록은 하루에 하나만 남긴다. */
export function addUsageLog(subscriptionId: string, date: string, minutes = 0) {
  const already = state.usageLogs.some(
    (log) => log.subscriptionId === subscriptionId && log.date === date,
  );
  if (already) return;

  const log: UsageLog = { id: newId("log"), subscriptionId, date, minutes };
  setData({ ...state, usageLogs: [...state.usageLogs, log] });
}

export function removeUsageLog(logId: string) {
  setData({ ...state, usageLogs: state.usageLogs.filter((log) => log.id !== logId) });
}

/** 그날 기록이 있으면 지우고, 없으면 넣는다. (달력에서 날짜를 눌렀을 때) */
export function toggleUsageLog(subscriptionId: string, date: string) {
  const found = state.usageLogs.find(
    (log) => log.subscriptionId === subscriptionId && log.date === date,
  );
  if (found) {
    removeUsageLog(found.id);
  } else {
    addUsageLog(subscriptionId, date);
  }
}

/** 그날 몇 분 썼는지 적는다. 기록이 없으면 만들어 준다. */
export function setUsageMinutes(
  subscriptionId: string,
  date: string,
  minutes: number,
) {
  const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0;
  const found = state.usageLogs.find(
    (log) => log.subscriptionId === subscriptionId && log.date === date,
  );

  if (!found) {
    addUsageLog(subscriptionId, date, safeMinutes);
    return;
  }

  setData({
    ...state,
    usageLogs: state.usageLogs.map((log) =>
      log.id === found.id ? { ...log, minutes: safeMinutes } : log,
    ),
  });
}

// ---- 월 단위 몰아 입력 ----

export function setMonthlyCount(subscriptionId: string, month: string, count: number) {
  const rest = state.monthlyCounts.filter(
    (item) => !(item.subscriptionId === subscriptionId && item.month === month),
  );

  // 빈칸으로 지우면 '몰아 입력 안 함'으로 되돌린다.
  if (!Number.isFinite(count) || count < 0) {
    setData({ ...state, monthlyCounts: rest });
    return;
  }

  const entry: MonthlyCount = {
    id: newId("count"),
    subscriptionId,
    month,
    count: Math.floor(count),
  };
  setData({ ...state, monthlyCounts: [...rest, entry] });
}

export function clearMonthlyCount(subscriptionId: string, month: string) {
  setData({
    ...state,
    monthlyCounts: state.monthlyCounts.filter(
      (item) => !(item.subscriptionId === subscriptionId && item.month === month),
    ),
  });
}

// ---- 전체 ----

/** 발표 시연 중에 꼬였을 때 샘플 데이터로 되돌리는 버튼용 */
export function resetToSeed() {
  setData(SEED_DATA);
}

/**
 * 전부 비운다. 샘플까지 다 지우고 구독 0개인 상태로 만든다.
 *
 * 샘플을 치우고 내 구독을 처음부터 넣어 보고 싶을 때 쓴다.
 * 되돌릴 수 없으므로 화면에서 한 번 더 물어본 뒤에 부른다.
 */
export function clearAll() {
  setData({ subscriptions: [], usageLogs: [], monthlyCounts: [] });
}
