"use client";

// 로그인한 사람만 앱 화면을 보게 막는 울타리.
//
// 모든 화면에 같은 코드를 넣는 대신 layout 에서 한 번만 감싼다.
// 로그인 화면(/login)은 당연히 울타리 밖에 둬야 들어갈 수 있다.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useAuth } from "@/lib/session";
import { useIsClient } from "@/lib/useIsClient";

const OPEN_PATHS = ["/login"];

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const isClient = useIsClient();
  const auth = useAuth();
  const pathname = usePathname();

  if (OPEN_PATHS.includes(pathname)) return <>{children}</>;

  // 서버에서 미리 그릴 때와 로그인 여부를 확인하는 동안
  if (!isClient || auth.status === "loading") {
    return (
      <main className="mx-auto w-full max-w-5xl px-5 py-10">
        <p className="text-sm text-ink-soft">불러오는 중…</p>
      </main>
    );
  }

  if (auth.status === "signedOut") {
    return (
      <main className="mx-auto w-full max-w-sm px-5 py-16 text-center">
        <h1 className="text-2xl font-bold text-ink">구독 습관 진단기</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          얼마나 쓰는지 기록하면, 끊을지 낮출지 바꿀지 골라 드립니다.
          <br />
          기록을 저장하려면 먼저 로그인해 주세요.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-xl bg-diag-deep px-6 py-3 font-semibold text-diag-ink"
        >
          로그인 / 회원가입
        </Link>
      </main>
    );
  }

  return (
    <>
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-2 text-xs">
          <span className="text-ink-soft">
            {auth.profile ? (
              <>
                <strong className="text-ink">{auth.profile.nickname}</strong>님
                {auth.profile.ageGroup && ` · ${auth.profile.ageGroup}`}
              </>
            ) : (
              auth.email
            )}
          </span>
          <button
            type="button"
            onClick={() => signOut()}
            className="underline underline-offset-2 text-ink-soft"
          >
            로그아웃
          </button>
        </div>
      </div>
      {children}
    </>
  );
}
