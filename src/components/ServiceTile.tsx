import { brandOf } from "@/data/services";

type Props = {
  serviceId: string;
  size?: "sm" | "md";
};

/**
 * 서비스를 알아보게 해 주는 브랜드 색 타일.
 *
 * 목록이 길어지면 이름만으로는 눈이 안 걸린다. 색 있는 네모가 있으면
 * 글자를 읽기 전에 "아 넷플릭스" 하고 먼저 걸린다.
 */
export default function ServiceTile({ serviceId, size = "md" }: Props) {
  const brand = brandOf(serviceId);
  const box = size === "sm" ? "size-8 text-[10px]" : "size-11 text-xs";

  return (
    <span
      className={`flex ${box} shrink-0 items-center justify-center rounded-xl font-bold tracking-tight text-white`}
      style={{ backgroundColor: brand.color }}
      aria-hidden="true"
    >
      {brand.label}
    </span>
  );
}
