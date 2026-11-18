"use client";

// 구독 추가 화면 (계획서 스케치 2번 화면).
//
// 서비스를 고르면 요금제 목록이 나오고, 요금제를 고르면 조사해 둔 요금이
// 자동으로 채워진다. 실제로 내는 금액이 다르면 사용자가 고쳐서 저장한다.
//
// 목록에 없는 서비스도 직접 입력할 수 있다.
// 목록은 21개뿐이라, 거기 없는 걸 쓰는 사람은 아예 등록을 못 했다.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CATEGORIES,
  SERVICES,
  categoryLabel,
  defaultPlanOf,
  findPlan,
  findService,
  type CategoryId,
} from "@/data/services";
import { won } from "@/lib/format";
import { addSubscription } from "@/lib/store";

/** 서비스 고르는 칸에서 '목록에 없어요'를 나타내는 값 */
const CUSTOM = "__custom__";

export default function NewSubscriptionPage() {
  const router = useRouter();

  const [serviceId, setServiceId] = useState("");
  const [planId, setPlanId] = useState("");
  const [price, setPrice] = useState("");
  const [billingDay, setBillingDay] = useState("1");
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState<CategoryId>("ott");
  const [error, setError] = useState("");

  const isCustom = serviceId === CUSTOM;
  const selectedService = isCustom ? undefined : findService(serviceId);
  const selectedPlan = selectedService ? findPlan(serviceId, planId) : undefined;

  function handleServiceChange(nextId: string) {
    setServiceId(nextId);
    setError("");

    if (nextId === CUSTOM) {
      setPlanId("");
      setPrice("");
      return;
    }

    const service = findService(nextId);
    if (!service) {
      setPlanId("");
      setPrice("");
      return;
    }

    // 가장 흔히 쓰는 요금제를 미리 골라 준다.
    const plan = defaultPlanOf(service);
    setPlanId(plan.id);
    setPrice(String(plan.price));
  }

  function handlePlanChange(nextPlanId: string) {
    setPlanId(nextPlanId);
    const plan = findPlan(serviceId, nextPlanId);
    if (plan) setPrice(String(plan.price));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const monthlyPrice = Number(price);
    if (!Number.isFinite(monthlyPrice) || monthlyPrice <= 0) {
      setError("월 요금을 0보다 큰 숫자로 입력해 주세요.");
      return;
    }

    if (isCustom) {
      const name = customName.trim();
      if (!name) {
        setError("서비스 이름을 입력해 주세요.");
        return;
      }

      // 같은 이름으로 또 넣으면 같은 서비스로 보이도록 이름에서 id 를 만든다.
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      addSubscription({
        serviceId: `custom-${slug}`,
        planId: "custom-plan",
        monthlyPrice: Math.round(monthlyPrice),
        billingDay: Number(billingDay),
        endedOn: null,
        customName: name,
        customCategory,
      });
      router.push("/");
      return;
    }

    if (!selectedService || !selectedPlan) {
      setError("서비스와 요금제를 골라 주세요.");
      return;
    }

    addSubscription({
      serviceId: selectedService.id,
      planId: selectedPlan.id,
      monthlyPrice: Math.round(monthlyPrice),
      billingDay: Number(billingDay),
      endedOn: null,
      customName: null,
      customCategory: null,
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
        지금 쓰고 있는 서비스와 요금제를 등록해 주세요.
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
            <option value={CUSTOM}>목록에 없어요 — 직접 입력</option>
          </select>
        </label>

        {isCustom ? (
          <>
            <label className="block rounded-xl bg-diag p-4">
              <span className="text-sm text-diag-ink">서비스 이름</span>
              <input
                type="text"
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="예: 라프텔"
                className="mt-1 w-full bg-transparent text-lg text-ink outline-none"
              />
            </label>

            <label className="block rounded-xl bg-diag p-4">
              <span className="text-sm text-diag-ink">카테고리</span>
              <select
                value={customCategory}
                onChange={(event) =>
                  setCustomCategory(event.target.value as CategoryId)
                }
                className="mt-1 w-full bg-transparent text-lg text-ink outline-none"
              >
                {CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-diag-ink/80">
                같은 카테고리끼리 비교하므로 가장 비슷한 쪽을 골라 주세요.
              </span>
            </label>
          </>
        ) : (
          <label className="block rounded-xl bg-diag p-4">
            <span className="text-sm text-diag-ink">요금제</span>
            <select
              value={planId}
              onChange={(event) => handlePlanChange(event.target.value)}
              disabled={!selectedService}
              className="mt-1 w-full bg-transparent text-lg text-ink outline-none disabled:text-ink-soft"
            >
              {!selectedService && <option value="">서비스를 먼저 고르세요</option>}
              {selectedService?.plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} · {won(plan.price)}
                </option>
              ))}
            </select>

            {selectedPlan && (
              <span className="mt-1 block text-xs text-diag-ink/80">
                {selectedPlan.ads ? "광고 있음" : "광고 없음"}
                {selectedPlan.quality && ` · ${selectedPlan.quality}`}
                {selectedPlan.devices && ` · 동시 ${selectedPlan.devices}대`}
                {selectedPlan.note && ` · ${selectedPlan.note}`}
              </span>
            )}
          </label>
        )}

        <label className="block rounded-xl bg-diag p-4">
          <span className="text-sm text-diag-ink">실제로 내는 월 요금 (원)</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="예: 13500"
            className="mt-1 w-full bg-transparent text-lg text-ink outline-none"
          />
          {selectedPlan && (
            <span className="text-xs text-diag-ink/80">
              {selectedPlan.name} 정가는 {won(selectedPlan.price)}입니다. 할인받아
              쓰고 있다면 실제 금액으로 고쳐 주세요.
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

        {!isCustom && (
          <div className="rounded-xl bg-page p-4">
            <span className="text-sm text-ink-soft">카테고리</span>
            <p className="mt-1 text-lg text-ink">
              {selectedService
                ? categoryLabel(selectedService.category)
                : "서비스를 고르면 정해집니다"}
            </p>
            <span className="text-xs text-ink-soft">
              갈아탈 서비스는 같은 카테고리 안에서 찾기 때문에 자동으로 정해집니다.
            </span>
          </div>
        )}

        {isCustom && (
          <p className="rounded-xl bg-page p-4 text-xs leading-relaxed text-ink-soft">
            ※ 직접 입력한 서비스는 요금제가 하나뿐이라 &lsquo;요금제 낮추기&rsquo;
            추천이 나오지 않습니다. 해지·유지 판단과 같은 카테고리의 더 싼 서비스
            추천은 그대로 됩니다.
          </p>
        )}

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
