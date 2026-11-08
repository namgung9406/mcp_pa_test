import { WorkItem } from "../_scheme/work";
import { dateOnly } from "../_const/seed";

export function daysUntil(date: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round(
    (new Date(`${date}T00:00:00`).getTime() - today.getTime()) / 86400000,
  );
}
export function weeklyCounts(
  items: WorkItem[],
): { label: string; created: number; complete: number }[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    const day = dateOnly(date);
    const records = items.filter(
      (item) => dateOnly(new Date(item.createdAt)) === day,
    );
    return {
      label: `${date.getMonth() + 1}.${date.getDate()}`,
      created: records.length,
      complete: records.filter((item) => item.status === "완료").length,
    };
  });
}
export function summary(items: WorkItem[]) {
  const complete = items.filter((item) => item.status === "완료").length;
  return {
    total: items.length,
    active: items.filter((item) => item.status === "진행 중").length,
    review: items.filter((item) => item.status === "검토 중").length,
    complete,
    rate: items.length ? Math.round((complete / items.length) * 100) : 0,
    attention: items.filter(
      (item) => item.status !== "완료" && daysUntil(item.dueDate) <= 3,
    ).length,
  };
}
