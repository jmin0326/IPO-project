"use client";

// 로그인 상태를 한곳에서 들고 있는 곳.
//
// Supabase 가 이메일·비밀번호와 로그인 세션을 알아서 관리해 준다.
// 우리가 따로 받는 닉네임·연령대는 profiles 테이블에 있어서, 로그인될 때마다
// 그것도 같이 읽어 와서 합쳐 둔다.
//
// store.ts 와 같은 방식(바깥 저장소 + useSyncExternalStore)을 쓴다.
// 그래야 effect 안에서 setState 를 부르지 않고도 화면이 따라 바뀐다.

import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export const AGE_GROUPS = ["10대", "20대", "30대", "40대", "50대 이상"];

export type Profile = {
  id: string;
  nickname: string;
  ageGroup: string | null;
};

export type AuthState = {
  /** loading = 아직 확인 중. 화면에서 섣불리 '로그인하세요'를 띄우면 안 된다. */
  status: "loading" | "signedIn" | "signedOut";
  userId: string | null;
  email: string | null;
  profile: Profile | null;
};

const LOADING: AuthState = {
  status: "loading",
  userId: null,
  email: null,
  profile: null,
};

const SIGNED_OUT: AuthState = {
  status: "signedOut",
  userId: null,
  email: null,
  profile: null,
};

let state: AuthState = LOADING;
const listeners = new Set<() => void>();

function setState(next: AuthState) {
  state = next;
  listeners.forEach((listener) => listener());
}

async function applySession(session: Session | null) {
  if (!session) {
    setState(SIGNED_OUT);
    return;
  }

  // 로그인은 됐지만 프로필을 아직 못 읽었을 수도 있으니 먼저 로그인 상태로 바꾼다.
  setState({
    status: "signedIn",
    userId: session.user.id,
    email: session.user.email ?? null,
    profile: null,
  });

  const { data } = await supabase
    .from("profiles")
    .select("id, nickname, age_group")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!data) return;

  setState({
    status: "signedIn",
    userId: session.user.id,
    email: session.user.email ?? null,
    profile: {
      id: data.id as string,
      nickname: data.nickname as string,
      ageGroup: (data.age_group as string | null) ?? null,
    },
  });
}

if (typeof window !== "undefined") {
  // 새로고침해도 로그인이 유지되는지 확인한다.
  void supabase.auth.getSession().then(({ data }) => applySession(data.session));

  // 로그인·로그아웃이 일어나면 알려 준다.
  supabase.auth.onAuthStateChange((_event, session) => {
    void applySession(session);
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAuth(): AuthState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => LOADING,
  );
}

/** 지금 로그인한 사람의 id. 로그인 안 했으면 null */
export function currentUserId(): string | null {
  return state.userId;
}

// ---- 회원가입 / 로그인 / 로그아웃 ----

export type AuthResult = { ok: true } | { ok: false; message: string };

export async function signUp(input: {
  email: string;
  password: string;
  nickname: string;
  ageGroup: string;
}): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });

  if (error) return { ok: false, message: error.message };

  // Supabase 설정에서 '이메일 확인'이 켜져 있으면 바로 로그인되지 않는다.
  // 그러면 세션이 없어서 profiles 에 쓸 수 없다(보안 규칙이 막는다).
  if (!data.session) {
    return {
      ok: false,
      message:
        "가입은 됐지만 바로 로그인되지 않았습니다. Supabase 설정에서 이메일 확인(Confirm email)을 꺼 주세요.",
    };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.session.user.id,
    nickname: input.nickname,
    age_group: input.ageGroup,
  });

  if (profileError) return { ok: false, message: profileError.message };

  await applySession(data.session);
  return { ok: true };
}

export async function signIn(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function signOut() {
  await supabase.auth.signOut();
}
