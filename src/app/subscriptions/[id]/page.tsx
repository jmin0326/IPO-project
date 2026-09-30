"use client";

// 구독 상세 화면 (계획서 스케치 4번 화면).
//
// 메인 화면 오른쪽 목록에서 구독을 누르면 여기로 온다.
//  - 이 구독 하나에 대한 진단 (1회당 비용, 해지 추천 순위)
//  - 요일별 이용 패턴 막대그래프
//  - 같은 카테고리에서 더 싼 대체 서비스 추천
//  - 해지하기 / 계속 유지 / 서비스 변경

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import WeekdayChart from "@/components/WeekdayChart";
import { categoryLabel } from "@/data/services";
import {
  buildStats,
  findAlternatives,
  sortByCancelPriority,
  weekdayCounts,
} from "@/lib/analyze";
import { formatMonthKey, monthKeyOf } from "@/lib/date";
import { particle, won } from "@/lib/format";
import {
  changeSubscriptionService,
  removeSubscription,
  useAppData,
} from "@/lib/store";
import { useToday } from "@/lib/today";
import { useIsClient } from "@/lib/useIsClient";

export default function SubscriptionDetailPage() {
  const isClient = useIsClient();
  const data = useAppData();
  const today = useToday();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [pickedServiceId, setPickedServiceId] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (!isClient) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-10">
        <p className="text-sm text-ink-soft">불러오는 중…</p>
      </main>
    );
  }

  const month = monthKeyOf(today);
  const stats = buildStats(data, month);
  const ranked = sortByCancelPriority(stats);

  const index = ranked.findIndex((item) => item.subscription.id === params.id);
  const stat = index >= 0 ? ranked[index] : undefined;

  if (!stat) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-10">
        <Link href="/" className="text-sm text-ink-soft">
          ‹ 돌아가기
        </Link>
        <p className="mt-6 rounded-2xl bg-white p-6 text-sm text-ink-soft shadow-sm">
          이 구독을 찾을 수 없습니다. 목록에서 지워졌을 수 있습니다.
        </p>
      </main>
    );
  }

  const { subscription, name, color, service, usageCount, costPerUse } = stat;
  const alternatives = findAlternatives(
    subscription.serviceId,
    subscription.monthlyPrice,
  );
  const picked = alternatives.find((item) => item.service.id === pickedServiceId);

  function handleCancel() {
    removeSubscription(subscription.id);
    router.push("/");
  }

  function handleChange() {
    if (!picked) return;
    changeSubscriptionService(
      subscription.id,
      picked.service.id,
      picked.service.defaultPrice,
    );
    router.push("/");
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <Link href="/" className="text-sm text-ink-soft">
        ‹ 돌아가기
      </Link>

      <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold text-ink">
        <span className="size-3 rounded-full" style={{ backgroundColor: color }} />
        {name}
      </h1>
      {service && (
        <p className="mt-1 text-sm text-ink-soft">{categoryLabel(service.category)}</p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2 md:items-start">
        {/* 이 구독 하나에 대한 진단 */}
        <section className="rounded-2xl bg-diag p-6 shadow-sm">
          <p className="text-2xl font-bold text-ink">
            {costPerUse === null ? "이번 달 이용 없음" : `1회당 ${won(costPerUse)}`}
          </p>
          <p className="mt-1 font-semibold text-diag-ink">
            해지 추천 {index + 1}순위
          </p>
          <p className="mt-4 text-sm text-ink-soft">
            월 {won(subscription.monthlyPrice)} / {formatMonthKey(month)}에{" "}
            {usageCount}회 사용
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            매월 {subscription.billingDay}일 결제
          </p>
          <p className="mt-4 rounded-lg bg-white px-3 py-2 text-sm text-ink">
            {stat.reason}
          </p>
        </section>

        {/* 요일별 이용 패턴 */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-ink">요일별 이용 횟수</h2>
          <p className="mt-1 mb-3 text-xs text-ink-soft">
            지금까지 남긴 기록 전체 기준입니다.
          </p>
          <WeekdayChart counts={weekdayCounts(data, subscription.id)} />
        </section>
      </div>

      {/* 대체 서비스 추천 */}
      <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-ink">대체 서비스 추천</h2>
        <p className="mt-1 mb-4 text-xs leading-relaxed text-ink-soft">
          같은 카테고리에서 지금보다 싼 서비스입니다. 절약액은 조사해 둔 기본 요금으로
          계산했기 때문에, 할인받아 쓰고 있다면 실제로는 이보다 덜 아낄 수 있습니다.
        </p>

        {alternatives.length === 0 ? (
          <p className="text-sm text-ink-soft">
            같은 카테고리에 지금보다 싼 서비스가 없습니다. 요금 자체는 이미 싼 편입니다.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {alternatives.map((alternative) => {
              const isPicked = alternative.service.id === pickedServiceId;
              return (
                <button
                  key={alternative.service.id}
                  type="button"
                  onClick={() =>
                    setPickedServiceId(isPicked ? null : alternative.service.id)
                  }
                  className={`rounded-xl border-2 p-4 text-left transition ${
                    isPicked
                      ? "border-diag-deep bg-diag"
                      : "border-transparent bg-page hover:border-diag-deep"
                  }`}
                >
                  <p className="font-semibold text-ink">
                    {alternative.service.name}
                    {isPicked && (
                      <span className="ml-1 text-sm text-diag-ink">선택됨 ✓</span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-ink">
                    {won(alternative.service.defaultPrice)} → 매달{" "}
                    <strong>{won(alternative.saving)} 절약</strong>
                  </p>
                  <p className="mt-2 text-xs text-ink-soft">
                    좋은 점: {alternative.service.strength}
                  </p>
                  <p className="mt-0.5 text-xs text-list-ink">
                    감안할 점: {alternative.service.weakness}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 결정 버튼 */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {confirmingCancel ? (
          <div className="rounded-xl bg-list p-3 text-center sm:col-span-3">
            <p className="text-sm text-list-ink">
              정말 목록에서 지울까요? {name} 이용 기록도 같이 지워집니다.
            </p>
            <div className="mt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg bg-list-deep px-4 py-2 text-sm font-semibold text-list-ink"
              >
                네, 해지합니다
              </button>
              <button
                type="button"
                onClick={() => setConfirmingCancel(false)}
                className="rounded-lg px-4 py-2 text-sm text-ink-soft"
              >
                아니요
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setConfirmingCancel(true)}
              className="rounded-xl bg-list px-5 py-3 font-semibold text-list-ink"
            >
              해지하기
            </button>

            <Link
              href="/"
              className="rounded-xl bg-page px-5 py-3 text-center font-semibold text-ink-soft"
            >
              계속 유지
            </Link>

            <button
              type="button"
              onClick={handleChange}
              disabled={!picked}
              className="rounded-xl bg-diag-deep px-5 py-3 font-semibold text-diag-ink disabled:bg-page disabled:text-ink-soft"
            >
              {picked
                ? `${picked.service.name}${particle(picked.service.name, "으로", "로")} 변경`
                : "서비스 변경"}
            </button>
          </>
        )}
      </div>

      {!confirmingCancel && (
        <p className="mt-3 text-xs text-ink-soft">
          {picked ? (
            <>
              ※ {picked.service.name}
              {particle(picked.service.name, "으로", "로")} 바꾸면 매달{" "}
              {won(picked.saving)}을 아낍니다. 지금까지 쌓인 이용 기록은 그대로
              남습니다.
            </>
          ) : (
            <>
              ※ &apos;서비스 변경&apos;은 위에서 대체 서비스를 고르면 눌립니다.
            </>
          )}
        </p>
      )}
    </main>
  );
}
