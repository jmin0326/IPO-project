// 요일별 이용 횟수 막대그래프 (계획서 스케치 4번 화면 오른쪽 위).
//
// 막대 높이는 '가장 많이 쓴 요일'을 100%로 두고 비율로 그린다.
// 절대 높이로 그리면 횟수가 적을 때 막대가 전부 눌려서 패턴이 안 보이기 때문이다.

const LABELS = ["월", "화", "수", "목", "금", "토", "일"];

type Props = {
  /** 0번이 월요일, 6번이 일요일 */
  counts: number[];
};

export default function WeekdayChart({ counts }: Props) {
  const max = Math.max(...counts);

  if (max === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-soft">
        아직 이용 기록이 없어서 그릴 패턴이 없습니다.
      </p>
    );
  }

  return (
    <div>
      <div className="flex h-28 items-end justify-between gap-2">
        {counts.map((count, index) => (
          <div
            key={LABELS[index]}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1"
          >
            <span className="text-[11px] text-ink-soft">{count || ""}</span>
            <div
              className="w-full rounded-t bg-list-deep"
              style={{ height: `${(count / max) * 100}%` }}
              title={`${LABELS[index]}요일 ${count}회`}
            />
          </div>
        ))}
      </div>

      <div className="mt-1 flex justify-between gap-2">
        {LABELS.map((label, index) => (
          <span
            key={label}
            className={`flex-1 text-center text-xs ${
              index === 6
                ? "text-red-500"
                : index === 5
                  ? "text-blue-500"
                  : "text-ink-soft"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
