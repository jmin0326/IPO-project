"use client";

// 로그인 / 회원가입 화면.
//
// 계획서 2번 Input 의 "회원가입 시 닉네임과 연령대를 입력한다"에 해당한다.
// 이메일·비밀번호는 Supabase 가 관리하고, 닉네임·연령대만 우리가 profiles 에 저장한다.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AGE_GROUPS, signIn, signUp, useAuth } from "@/lib/session";
import { useIsClient } from "@/lib/useIsClient";

export default function LoginPage() {
  const isClient = useIsClient();
  const auth = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [ageGroup, setAgeGroup] = useState(AGE_GROUPS[0]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isClient) {
    return (
      <main className="mx-auto w-full max-w-sm px-5 py-16">
        <p className="text-sm text-ink-soft">불러오는 중…</p>
      </main>
    );
  }

  // 이미 로그인한 사람이 들어오면 메인으로 보낸다.
  if (auth.status === "signedIn") {
    return (
      <main className="mx-auto w-full max-w-sm px-5 py-16 text-center">
        <p className="text-ink">
          이미 로그인되어 있습니다
          {auth.profile && ` — ${auth.profile.nickname}님`}
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-4 rounded-xl bg-diag-deep px-5 py-3 font-semibold text-diag-ink"
        >
          내 구독 보러 가기
        </button>
      </main>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    if (mode === "signUp" && !nickname.trim()) {
      setError("닉네임을 입력해 주세요.");
      return;
    }

    setBusy(true);

    const result =
      mode === "signUp"
        ? await signUp({
            email: email.trim(),
            password,
            nickname: nickname.trim(),
            ageGroup,
          })
        : await signIn({ email: email.trim(), password });

    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.push("/");
  }

  return (
    <main className="mx-auto w-full max-w-sm px-5 py-12">
      <h1 className="text-2xl font-bold text-ink">구독 습관 진단기</h1>
      <p className="mt-1 text-sm text-ink-soft">
        기록한 구독을 어느 기기에서나 보려면 로그인이 필요합니다.
      </p>

      <div className="mt-6 flex gap-1 rounded-xl bg-page p-1">
        {(["signIn", "signUp"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setMode(item);
              setError("");
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              mode === item ? "bg-white text-ink shadow-sm" : "text-ink-soft"
            }`}
          >
            {item === "signIn" ? "로그인" : "회원가입"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <label className="block rounded-xl bg-diag p-4">
          <span className="text-sm text-diag-ink">이메일</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="me@example.com"
            className="mt-1 w-full bg-transparent text-lg text-ink outline-none"
          />
        </label>

        <label className="block rounded-xl bg-diag p-4">
          <span className="text-sm text-diag-ink">비밀번호</span>
          <input
            type="password"
            autoComplete={mode === "signUp" ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="6자 이상"
            className="mt-1 w-full bg-transparent text-lg text-ink outline-none"
          />
        </label>

        {mode === "signUp" && (
          <>
            <label className="block rounded-xl bg-diag p-4">
              <span className="text-sm text-diag-ink">닉네임</span>
              <input
                type="text"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="앱에서 보일 이름"
                className="mt-1 w-full bg-transparent text-lg text-ink outline-none"
              />
            </label>

            <label className="block rounded-xl bg-diag p-4">
              <span className="text-sm text-diag-ink">연령대</span>
              <select
                value={ageGroup}
                onChange={(event) => setAgeGroup(event.target.value)}
                className="mt-1 w-full bg-transparent text-lg text-ink outline-none"
              >
                {AGE_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        {error && (
          <p className="rounded-lg bg-list px-3 py-2 text-sm text-list-ink">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-diag-deep px-5 py-3 font-semibold text-diag-ink disabled:opacity-60"
        >
          {busy ? "잠시만요…" : mode === "signIn" ? "로그인" : "가입하고 시작하기"}
        </button>
      </form>

      <p className="mt-6 text-xs leading-relaxed text-ink-soft">
        ※ 등록한 구독과 이용 기록은 본인만 볼 수 있습니다. 데이터베이스에 보안
        규칙(RLS)을 걸어 두어서, 다른 사람이 키를 알아도 남의 기록은 읽을 수
        없습니다.
      </p>
    </main>
  );
}
