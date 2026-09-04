"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Item = {
  id: number;
  content: string;
  created_at: string;
};

export default function Home() {
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
    <div className="flex min-h-screen flex-col items-center gap-6 bg-zinc-50 px-4 py-16 dark:bg-black">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Supabase 저장·조회 테스트
      </h1>

      <div className="flex w-full max-w-md gap-2">
        <input
          className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요"
        />
        <button
          className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
          onClick={handleSave}
        >
          저장
        </button>
      </div>

      {status && <p className="text-sm text-zinc-500">{status}</p>}

      <ul className="w-full max-w-md space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded border border-zinc-200 px-3 py-2 dark:border-zinc-800"
          >
            {item.content}
          </li>
        ))}
      </ul>
    </div>
  );
}
