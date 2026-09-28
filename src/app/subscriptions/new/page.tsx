"use client";

// 구독 추가 화면 (계획서 스케치 2번 화면).
//
// 서비스를 고르면 조사해 둔 기본 요금이 자동으로 채워지고,
// 실제로 내는 금액이 다르면 사용자가 고쳐서 저장한다.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORIES, SERVICES, categoryLabel, findService } from "@/data/services";
import { addSubscription } from "@/lib/store";

export default function NewSubscriptionPage() {
  const router = useRouter();

  const [serviceId, setServiceId] = useState("");
  const [price, setPrice] = useState("");
  const [billingDay, setBillingDay] = useState("1");
  const [error, setError] = useState("");

  const selected = findService(serviceId);

  function handleServiceChange(nextId: string) {
    setServiceId(nextId);
    // 고른 서비스의 조사된 기본 요금을 미리 채워 준다.
    const service = findService(nextId);
    setPrice(service ? String(service.defaultPrice) : "");
    setError("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!selected) {
      setError("서비스를 골라 주세요.");
      return;
    }

    const monthlyPrice = Number(price);
    if (!Number.isFinite(monthlyPrice) || monthlyPrice <= 0) {
      setError("월 요금을 0보다 큰 숫자로 입력해 주세요.");
      return;
    }

    addSubscription({
      serviceId: selected.id,
      monthlyPrice: Math.round(monthlyPrice),
      billingDay: Number(billingDay),
    });

    router.push("/");
  }

  return (
    <main className="mx-auto w-full max-w-md px-5 py-10">
      <Link href="/" className="text-sm text-ink-soft">
        ‹ 구독 추가
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-ink">구독 추가</h1>
      <p className="mt-1 text-sm text-ink-soft">
        지금 쓰고 있는 서비스와 실제로 내는 금액을 등록해 주세요.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <label className="block rounded-xl bg-diag p-4">
          <span className="text-sm text-diag-ink">서비스</span>
          <select
            value={serviceId}
            onChange={(event) => handleServiceChange(event.target.value)}
            className="mt-1 w-full bg-transparent text-lg text-ink outline-none"
          >
            <option value="">— 고르세요 —</option>
            {CATEGORIES.map((category) => (
              <optgroup key={category.id} label={category.label}>
                {SERVICES.filter((service) => service.category === category.id).map(
                  (service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ),
                )}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="block rounded-xl bg-diag p-4">
          <span className="text-sm text-diag-ink">월 요금 (원)</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="예: 13500"
            className="mt-1 w-full bg-transparent text-lg text-ink outline-none"
          />
          {selected && (
            <span className="text-xs text-diag-ink/80">
              조사된 기본 요금: {selected.defaultPrice.toLocaleString("ko-KR")}원 ·
              실제로 내는 금액이 다르면 고쳐 주세요
            </span>
          )}
        </label>

        <label className="block rounded-xl bg-diag p-4">
          <span className="text-sm text-diag-ink">결제일</span>
          <select
            value={billingDay}
            onChange={(event) => setBillingDay(event.target.value)}
            className="mt-1 w-full bg-transparent text-lg text-ink outline-none"
          >
            {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
              <option key={day} value={day}>
                매월 {day}일
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-xl bg-page p-4">
          <span className="text-sm text-ink-soft">카테고리</span>
          <p className="mt-1 text-lg text-ink">
            {selected ? categoryLabel(selected.category) : "서비스를 고르면 정해집니다"}
          </p>
          <span className="text-xs text-ink-soft">
            대체 서비스는 같은 카테고리 안에서 찾기 때문에 자동으로 정해집니다.
          </span>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
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
      </form>
    </main>
  );
}
