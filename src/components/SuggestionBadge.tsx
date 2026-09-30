import { SUGGESTION_LABELS, type SuggestionKind } from "@/lib/analyze";

/**
 * 추천 종류를 한눈에 보여 주는 뱃지.
 *
 * 색으로 성격을 나눈다.
 *  - 살구색: 손봐야 하는 것 (해지·낮추기·더 싼 서비스)
 *  - 하늘색: 더 쓰라고 권하는 것 (올리기·더 큰 서비스)
 *  - 회색  : 그대로 둬도 되는 것
 */
const STYLES: Record<SuggestionKind, string> = {
  cancel: "bg-list-deep text-list-ink",
  downgrade: "bg-list text-list-ink",
  "switch-cheaper": "bg-list text-list-ink",
  "switch-richer": "bg-diag text-diag-ink",
  upgrade: "bg-diag text-diag-ink",
  keep: "bg-page text-ink-soft",
};

export default function SuggestionBadge({ kind }: { kind: SuggestionKind }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${STYLES[kind]}`}
    >
      {SUGGESTION_LABELS[kind]}
    </span>
  );
}
