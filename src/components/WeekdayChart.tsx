// 요일별 이용 패턴 막대그래프 (계획서 스케치 4번 화면 오른쪽 위).
//
// 막대 높이는 '가장 많은 요일'을 100%로 두고 비율로 그린다.
// 절대 높이로 그리면 값이 작을 때 막대가 전부 눌려서 패턴이 안 보이기 때문이다.

const LABELS = ["월", "화", "수", "목", "금", "토", "일"];

type Props = {
  /** 0번이 월요일, 6번이 일요일 */
  values: number[];
  /** 분 단위인지 횟수인지 */
  unit: "minutes" | "count";
};

function formatValue(value: number, unit: Props["unit"]): string {
  if (value === 0) return "";
  if (unit === "count") return String(value);
  // 60분이 넘으면 시간으로 읽기 쉽게 바꾼다
  if (value >= 60) {
    const hours = Math.floor(value / 60);
    const rest = value % 60;
    return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
  }
  return `${value}분`;
}

export default function WeekdayChart({ values, unit }: Props) {
  const max = Math.max(...values);

  if (max === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-soft">
        아직 이용 기록이 없어서 그릴 패턴이 없습니다.
      </p>
    );
  }

  return (
    <div>
      <div className="flex h-28 items-end justify-between gap-1">
        {values.map((value, index) => (
          <div
            key={LABELS[index]}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1"
          >
            <span className="whitespace-nowrap text-[10px] text-ink-soft">
              {formatValue(value, unit)}
            </span>
            <div
              className="w-full rounded-t bg-list-deep"
              style={{ height: `${(value / max) * 100}%` }}
              title={`${LABELS[index]}요일 ${formatValue(value, unit) || 0}`}
            />
          </div>
        ))}
      </div>

      <div className="mt-1 flex justify-between gap-1">
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
