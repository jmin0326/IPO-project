"use client";

// 이번 달 이용 횟수 몰아 입력 화면 (계획서 스케치 3번 화면).
//
// 달력에 하루하루 남기는 게 원칙이지만, 날짜까지는 기억 못 하는 사람이 많다.
// 그래서 "이번 달에 몇 번 썼는지"만 숫자로 받는 길을 따로 열어 둔다.
// 여기에 값을 넣으면 그 달은 달력 기록 대신 이 값을 쓴다.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { serviceColor, serviceName } from "@/data/services";
import { countUsage } from "@/lib/analyze";
import { currentMonthKey, formatMonthKey } from "@/lib/date";
import { clearMonthlyCount, setMonthlyCount, useAppData } from "@/lib/store";
import { useIsClient } from "@/lib/useIsClient";

export default function UsagePage() {
  const isClient = useIsClient();
  const data = useAppData();
  const router = useRouter();

  // 사용자가 고친 칸만 담아 둔다. 안 고친 칸은 항상 현재 데이터를 보여 준다.
  const [draft, setDraft] = useState<Record<string, string>>({});

  if (!isClient) {
    return (
      <main className="mx-auto w-full max-w-md px-5 py-10">
        <p className="text-sm text-ink-soft">불러오는 중…</p>
      </main>
    );
  }

  const month = currentMonthKey();

  function handleSave() {
    for (const subscription of data.subscriptions) {
      const typed = draft[subscription.id];
      if (typed === undefined) continue;

      if (typed.trim() === "") {
        clearMonthlyCount(subscription.id, month);
        continue;
      }

      const count = Number(typed);
      if (Number.isFinite(count) && count >= 0) {
        setMonthlyCount(subscription.id, month, count);
      }
    }
    router.push("/");
  }

  return (
    <main className="mx-auto w-full max-w-md px-5 py-10">
      <Link href="/" className="text-sm text-ink-soft">
        ‹ 이번 달 이용 횟수 입력
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-ink">
        {formatMonthKey(month)}에 몇 번 쓰셨나요?
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        기억나는 대로 적어 주세요. 비워 두면 달력에 남긴 기록을 그대로 씁니다.
      </p>

      {data.subscriptions.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-ink-soft shadow-sm">
          등록된 구독이 없습니다.
        </p>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {data.subscriptions.map((subscription) => {
              const { loggedCount, manualCount } = countUsage(
                data,
                subscription.id,
                month,
              );
              const value =
                draft[subscription.id] ??
                (manualCount === null ? "" : String(manualCount));

              return (
                <li key={subscription.id} className="rounded-xl bg-diag p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 font-semibold text-ink">
                      <span
                        className="size-2 rounded-full"
                        style={{
                          backgroundColor: serviceColor(subscription.serviceId),
                        }}
                      />
                      {serviceName(subscription.serviceId)}
                    </span>

                    <span className="flex items-baseline gap-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={value}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            [subscription.id]: event.target.value,
                          })
                        }
                        placeholder={String(loggedCount)}
                        className="w-20 rounded-lg bg-white px-2 py-1 text-right text-lg text-ink outline-none"
                      />
                      <span className="text-sm text-diag-ink">회</span>
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-diag-ink/80">
                    달력에 남긴 기록: {loggedCount}회
                    {manualCount !== null && ` · 지금 몰아 입력값: ${manualCount}회`}
                  </p>
                </li>
              );
            })}
          </ul>

          <div className="flex gap-2 pt-5">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 rounded-xl bg-diag-deep px-5 py-3 font-semibold text-diag-ink"
            >
              저장
            </button>
            <Link
              href="/"
              className="rounded-xl px-5 py-3 text-center font-semibold text-ink-soft"
            >
              취소
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
