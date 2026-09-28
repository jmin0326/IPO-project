"use client";

// 화면 맨 위의 얇은 띠. 앱이 '오늘'이라고 보는 날짜를 옮긴다.
//
// 결제일이 지난 뒤나 다음 달 화면을 확인하려고 실제로 그날까지 기다릴 수는 없어서
// 만든 보기용 도구다. 진짜 오늘이 아닐 때는 색을 바꿔서 착각하지 않게 한다.

import { formatDateKey, shiftDay, todayKey } from "@/lib/date";
import { setToday, useToday } from "@/lib/today";
import { useIsClient } from "@/lib/useIsClient";

export default function DemoDateBar() {
  const isClient = useIsClient();
  const today = useToday();

  // 서버에서 그릴 때는 높이만 잡아 둔다. (화면이 덜컥 움직이지 않게)
  if (!isClient) {
    return <div className="h-9 border-b border-zinc-200 bg-white" />;
  }

  const isFake = today !== todayKey();

  return (
    <div
      className={`border-b ${
        isFake ? "border-list-deep bg-list" : "border-zinc-200 bg-white"
      }`}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-2 px-5 py-2 text-xs">
        <span className={isFake ? "text-list-ink" : "text-ink-soft"}>
          보기용 날짜
        </span>

        <button
          type="button"
          onClick={() => setToday(shiftDay(today, -1))}
          aria-label="하루 전"
          className="rounded px-2 py-0.5 text-sm hover:bg-white"
        >
          ‹
        </button>

        <span className="min-w-28 text-center font-semibold text-ink">
          {formatDateKey(today)}
        </span>

        <button
          type="button"
          onClick={() => setToday(shiftDay(today, 1))}
          aria-label="하루 뒤"
          className="rounded px-2 py-0.5 text-sm hover:bg-white"
        >
          ›
        </button>

        {isFake ? (
          <>
            <button
              type="button"
              onClick={() => setToday(null)}
              className="rounded bg-white px-2 py-0.5 font-semibold text-list-ink"
            >
              진짜 오늘로
            </button>
            <span className="text-list-ink">
              ※ 실제 오늘이 아닙니다 (오늘은 {formatDateKey(todayKey())})
            </span>
          </>
        ) : (
          <span className="text-ink-soft">
            앞뒤로 옮기면 달력·진단이 그 날짜 기준으로 바뀝니다
          </span>
        )}
      </div>
    </div>
  );
}
