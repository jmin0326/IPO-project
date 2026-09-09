// Supabase 연결 확인용 페이지 (차시 6 준비 단계에서 만든 것).
// 메인 화면을 만들면서 "/" 에서 이쪽으로 옮겼다.
// 차시 7에서 진짜 테이블(구독·이용 기록)에 연결하고 나면 지울 예정이다.

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Item = {
  id: number;
  content: string;
  created_at: string;
};

export default function SupabaseTestPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");

  async function loadItems() {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setStatus(`불러오기 실패: ${error.message}`);
      return;
    }
    setItems(data ?? []);
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleSave() {
    if (!content.trim()) return;
    const { error } = await supabase.from("items").insert({ content });
    if (error) {
      setStatus(`저장 실패: ${error.message}`);
      return;
    }
    setContent("");
    setStatus("저장 완료");
    loadItems();
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 py-16">
      <h1 className="text-2xl font-semibold text-ink">
        Supabase 저장·조회 테스트
      </h1>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded border border-zinc-300 bg-white px-3 py-2"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요"
        />
        <button
          className="rounded bg-black px-4 py-2 text-white"
          onClick={handleSave}
        >
          저장
        </button>
      </div>

      {status && <p className="text-sm text-ink-soft">{status}</p>}

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded border border-zinc-200 bg-white px-3 py-2"
          >
            {item.content}
          </li>
        ))}
      </ul>
    </div>
  );
}
