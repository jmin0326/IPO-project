"use client";

// 앱 데이터를 한곳에 모아 두는 곳. 이제 진짜 데이터베이스(Supabase)에 저장한다.
//
// 바뀐 점
//   - 로그인한 사람의 데이터만 불러오고, 저장도 그 사람 몫으로만 들어간다.
//   - 저장이 느리거나 실패할 수 있어서 '불러오는 중'과 '저장 실패' 상태가 생겼다.
//
// 화면을 멈추지 않으려고 '먼저 화면부터 바꾸고 나중에 서버에 보내는' 방식을 쓴다.
// 서버가 거절하면 에러를 띄우고 서버 내용으로 다시 맞춘다. 그래야 화면과 DB가
// 어긋난 채로 남지 않는다.
//
// DB는 snake_case(service_id), 앱은 camelCase(serviceId)를 쓴다.
// 둘을 바꿔 주는 코드도 전부 이 파일 안에만 둔다.

import { useSyncExternalStore } from "react";
import { SEED_DATA } from "@/data/seed";
import { currentUserId, subscribeAuth } from "./session";
import { supabase } from "./supabaseClient";
import type { AppData, MonthlyCount, Subscription, UsageLog } from "./types";

const EMPTY: AppData = { subscriptions: [], usageLogs: [], monthlyCounts: [] };

export type StoreState = {
  /** idle = 아직 로그인 전, loading = 불러오는 중, ready = 다 불러옴 */
  status: "idle" | "loading" | "ready";
  data: AppData;
  /** 저장이나 불러오기가 실패했을 때 보여 줄 말 */
  error: string | null;
};

let state: StoreState = { status: "idle", data: EMPTY, error: null };
let userId: string | null = null;

const listeners = new Set<() => void>();

function setState(next: StoreState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function setData(data: AppData) {
  setState({ ...state, data });
}

function setError(message: string) {
  setState({ ...state, error: message });
}

export function clearError() {
  setState({ ...state, error: null });
}

// ---- DB 행 <-> 앱 데이터 ----

type SubscriptionRow = {
  id: string;
  service_id: string;
  plan_id: string;
  monthly_price: number;
  billing_day: number;
};

type UsageLogRow = {
  id: string;
  subscription_id: string;
  used_on: string;
  minutes: number | null;
};

type MonthlyCountRow = {
  id: string;
  subscription_id: string;
  month: string;
  count: number;
};

function toSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    serviceId: row.service_id,
    planId: row.plan_id,
    monthlyPrice: row.monthly_price,
    billingDay: row.billing_day,
  };
}

function toUsageLog(row: UsageLogRow): UsageLog {
  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    date: row.used_on,
    minutes: row.minutes ?? 0,
  };
}

function toMonthlyCount(row: MonthlyCountRow): MonthlyCount {
  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    month: row.month,
    count: row.count,
  };
}

// ---- 불러오기 ----

async function reload() {
  if (!userId) return;

  setState({ ...state, status: "loading" });

  const [subs, logs, counts] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("user_id", userId),
    supabase.from("usage_logs").select("*").eq("user_id", userId),
    supabase.from("monthly_counts").select("*").eq("user_id", userId),
  ]);

  const failure = subs.error ?? logs.error ?? counts.error;
  if (failure) {
    setState({
      status: "ready",
      data: EMPTY,
      error: `데이터를 불러오지 못했습니다: ${failure.message}`,
    });
    return;
  }

  setState({
    status: "ready",
    error: null,
    data: {
      subscriptions: (subs.data as SubscriptionRow[]).map(toSubscription),
      usageLogs: (logs.data as UsageLogRow[]).map(toUsageLog),
      monthlyCounts: (counts.data as MonthlyCountRow[]).map(toMonthlyCount),
    },
  });
}

// 로그인 상태가 바뀌면 데이터를 다시 맞춘다.
if (typeof window !== "undefined") {
  subscribeAuth(() => {
    const next = currentUserId();
    if (next === userId) return;

    userId = next;
    if (!userId) {
      setState({ status: "idle", data: EMPTY, error: null });
      return;
    }
    void reload();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const SERVER_STATE: StoreState = { status: "idle", data: EMPTY, error: null };

export function useStore(): StoreState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
}

/** 화면에서 데이터만 읽을 때 쓰는 훅 */
export function useAppData(): AppData {
  return useStore().data;
}

/** 저장이 실패했을 때 화면과 DB가 어긋나지 않게 서버 내용으로 되돌린다. */
async function failAndResync(message: string) {
  setError(message);
  await reload();
}

function tempId(prefix: string): string {
  return `temp-${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

// ---- 구독 ----

export async function addSubscription(input: Omit<Subscription, "id">) {
  if (!userId) return;

  // 먼저 화면에 바로 보여 준다. (서버 응답을 기다리면 버튼이 멈춘 것처럼 보인다)
  const placeholder: Subscription = { ...input, id: tempId("sub") };
  setData({ ...state.data, subscriptions: [...state.data.subscriptions, placeholder] });

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      service_id: input.serviceId,
      plan_id: input.planId,
      monthly_price: input.monthlyPrice,
      billing_day: input.billingDay,
    })
    .select()
    .single();

  if (error || !data) {
    await failAndResync(`구독을 저장하지 못했습니다: ${error?.message ?? "알 수 없는 오류"}`);
    return;
  }

  // 임시로 붙여 둔 줄을 서버가 만들어 준 진짜 줄로 바꾼다.
  setData({
    ...state.data,
    subscriptions: state.data.subscriptions.map((item) =>
      item.id === placeholder.id ? toSubscription(data as SubscriptionRow) : item,
    ),
  });
}

/** 같은 서비스 안에서 요금제만 바꾼다. */
export async function changeSubscriptionPlan(
  subscriptionId: string,
  planId: string,
  monthlyPrice: number,
) {
  setData({
    ...state.data,
    subscriptions: state.data.subscriptions.map((item) =>
      item.id === subscriptionId ? { ...item, planId, monthlyPrice } : item,
    ),
  });

  const { error } = await supabase
    .from("subscriptions")
    .update({ plan_id: planId, monthly_price: monthlyPrice })
    .eq("id", subscriptionId);

  if (error) await failAndResync(`요금제를 바꾸지 못했습니다: ${error.message}`);
}

/**
 * 같은 구독을 다른 서비스로 갈아탄다.
 * 이용 기록은 그대로 둔다. 하던 일은 그대로고 수단만 바뀐 것이기 때문이다.
 */
export async function changeSubscriptionService(
  subscriptionId: string,
  serviceId: string,
  planId: string,
  monthlyPrice: number,
) {
  setData({
    ...state.data,
    subscriptions: state.data.subscriptions.map((item) =>
      item.id === subscriptionId
        ? { ...item, serviceId, planId, monthlyPrice }
        : item,
    ),
  });

  const { error } = await supabase
    .from("subscriptions")
    .update({ service_id: serviceId, plan_id: planId, monthly_price: monthlyPrice })
    .eq("id", subscriptionId);

  if (error) await failAndResync(`서비스를 바꾸지 못했습니다: ${error.message}`);
}

/**
 * 구독을 지운다.
 *
 * 딸린 이용 기록과 몰아 입력은 DB가 알아서 같이 지운다.
 * (schema.sql 의 on delete cascade) 앱에서 하나씩 지우는 것보다 안전하다.
 */
export async function removeSubscription(subscriptionId: string) {
  setData({
    subscriptions: state.data.subscriptions.filter((item) => item.id !== subscriptionId),
    usageLogs: state.data.usageLogs.filter(
      (log) => log.subscriptionId !== subscriptionId,
    ),
    monthlyCounts: state.data.monthlyCounts.filter(
      (item) => item.subscriptionId !== subscriptionId,
    ),
  });

  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("id", subscriptionId);

  if (error) await failAndResync(`구독을 지우지 못했습니다: ${error.message}`);
}

// ---- 이용 기록 ----

export async function addUsageLog(subscriptionId: string, date: string, minutes = 0) {
  if (!userId) return;

  const already = state.data.usageLogs.some(
    (log) => log.subscriptionId === subscriptionId && log.date === date,
  );
  if (already) return;

  const placeholder: UsageLog = {
    id: tempId("log"),
    subscriptionId,
    date,
    minutes,
  };
  setData({ ...state.data, usageLogs: [...state.data.usageLogs, placeholder] });

  const { data, error } = await supabase
    .from("usage_logs")
    .insert({
      user_id: userId,
      subscription_id: subscriptionId,
      used_on: date,
      minutes,
    })
    .select()
    .single();

  if (error || !data) {
    await failAndResync(`이용 기록을 저장하지 못했습니다: ${error?.message ?? "알 수 없는 오류"}`);
    return;
  }

  setData({
    ...state.data,
    usageLogs: state.data.usageLogs.map((log) =>
      log.id === placeholder.id ? toUsageLog(data as UsageLogRow) : log,
    ),
  });
}

export async function removeUsageLog(logId: string) {
  setData({
    ...state.data,
    usageLogs: state.data.usageLogs.filter((log) => log.id !== logId),
  });

  const { error } = await supabase.from("usage_logs").delete().eq("id", logId);
  if (error) await failAndResync(`이용 기록을 지우지 못했습니다: ${error.message}`);
}

/** 그날 기록이 있으면 지우고, 없으면 넣는다. (달력에서 날짜를 눌렀을 때) */
export async function toggleUsageLog(subscriptionId: string, date: string) {
  const found = state.data.usageLogs.find(
    (log) => log.subscriptionId === subscriptionId && log.date === date,
  );

  if (found) {
    await removeUsageLog(found.id);
  } else {
    await addUsageLog(subscriptionId, date);
  }
}

/** 그날 몇 분 썼는지 적는다. 기록이 없으면 만들어 준다. */
export async function setUsageMinutes(
  subscriptionId: string,
  date: string,
  minutes: number,
) {
  const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0;

  const found = state.data.usageLogs.find(
    (log) => log.subscriptionId === subscriptionId && log.date === date,
  );

  if (!found) {
    await addUsageLog(subscriptionId, date, safeMinutes);
    return;
  }

  setData({
    ...state.data,
    usageLogs: state.data.usageLogs.map((log) =>
      log.id === found.id ? { ...log, minutes: safeMinutes } : log,
    ),
  });

  // 아직 서버에 안 올라간 줄이면 지금 고쳐도 소용없다. 올라간 뒤에 다시 누르면 된다.
  if (found.id.startsWith("temp-")) return;

  const { error } = await supabase
    .from("usage_logs")
    .update({ minutes: safeMinutes })
    .eq("id", found.id);

  if (error) await failAndResync(`이용 시간을 저장하지 못했습니다: ${error.message}`);
}

// ---- 월 단위 몰아 입력 ----

export async function setMonthlyCount(
  subscriptionId: string,
  month: string,
  count: number,
) {
  if (!userId) return;

  if (!Number.isFinite(count) || count < 0) {
    await clearMonthlyCount(subscriptionId, month);
    return;
  }

  const value = Math.floor(count);
  const rest = state.data.monthlyCounts.filter(
    (item) => !(item.subscriptionId === subscriptionId && item.month === month),
  );
  setData({
    ...state.data,
    monthlyCounts: [
      ...rest,
      { id: tempId("count"), subscriptionId, month, count: value },
    ],
  });

  // (subscription_id, month) 가 unique 라서, 있으면 고치고 없으면 넣는 upsert 가 된다.
  const { error } = await supabase.from("monthly_counts").upsert(
    {
      user_id: userId,
      subscription_id: subscriptionId,
      month,
      count: value,
    },
    { onConflict: "subscription_id,month" },
  );

  if (error) {
    await failAndResync(`이용 횟수를 저장하지 못했습니다: ${error.message}`);
    return;
  }

  // 서버가 만들어 준 진짜 id 를 받아 오려고 한 번 더 맞춘다.
  await reload();
}

export async function clearMonthlyCount(subscriptionId: string, month: string) {
  setData({
    ...state.data,
    monthlyCounts: state.data.monthlyCounts.filter(
      (item) => !(item.subscriptionId === subscriptionId && item.month === month),
    ),
  });

  const { error } = await supabase
    .from("monthly_counts")
    .delete()
    .eq("subscription_id", subscriptionId)
    .eq("month", month);

  if (error) await failAndResync(`이용 횟수를 지우지 못했습니다: ${error.message}`);
}

// ---- 전체 ----

/** 이 계정의 구독을 전부 지운다. (이용 기록도 DB가 같이 지운다) */
export async function clearAll() {
  if (!userId) return;

  setData(EMPTY);

  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("user_id", userId);

  if (error) {
    await failAndResync(`지우지 못했습니다: ${error.message}`);
    return;
  }
  await reload();
}

/**
 * 시연용 샘플 데이터를 이 계정에 넣는다.
 *
 * 예전에는 앱을 켜면 샘플이 그냥 보였는데, 이제는 계정마다 데이터가 따로라
 * 새로 가입한 사람은 빈 화면에서 시작한다.
 * 샘플은 이 버튼을 눌렀을 때만 들어간다.
 */
export async function loadSampleData() {
  if (!userId) return;

  await clearAll();
  if (state.error) return;

  const { data: inserted, error } = await supabase
    .from("subscriptions")
    .insert(
      SEED_DATA.subscriptions.map((item) => ({
        user_id: userId,
        service_id: item.serviceId,
        plan_id: item.planId,
        monthly_price: item.monthlyPrice,
        billing_day: item.billingDay,
      })),
    )
    .select();

  if (error || !inserted) {
    await failAndResync(`샘플 구독을 넣지 못했습니다: ${error?.message ?? "알 수 없는 오류"}`);
    return;
  }

  // 샘플 데이터의 구독 id 는 'sub-netflix' 같은 가짜 id 다.
  // DB 가 만들어 준 진짜 id 로 바꿔서 이용 기록을 붙여야 한다.
  const idByService = new Map(
    (inserted as SubscriptionRow[]).map((row) => [row.service_id, row.id]),
  );
  const serviceBySeedId = new Map(
    SEED_DATA.subscriptions.map((item) => [item.id, item.serviceId]),
  );

  const logs = SEED_DATA.usageLogs
    .map((log) => {
      const serviceId = serviceBySeedId.get(log.subscriptionId);
      const realId = serviceId ? idByService.get(serviceId) : undefined;
      if (!realId) return null;
      return {
        user_id: userId,
        subscription_id: realId,
        used_on: log.date,
        minutes: log.minutes,
      };
    })
    .filter((row) => row !== null);

  if (logs.length > 0) {
    const { error: logError } = await supabase.from("usage_logs").insert(logs);
    if (logError) {
      await failAndResync(`샘플 이용 기록을 넣지 못했습니다: ${logError.message}`);
      return;
    }
  }

  await reload();
}
