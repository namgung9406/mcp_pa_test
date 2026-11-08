import {
  Activity,
  CreateWork,
  Snapshot,
  Status,
  WorkItem,
  commentSchema,
  createWorkSchema,
  statusSchema,
  workSchema,
} from "../_scheme/work";
import { createSeed } from "../_const/seed";

export class DemoService {
  private snapshot: Snapshot = createSeed();
  public userName: string;
  public readOnly: boolean;
  public constructor(userName: string, readOnly: boolean) {
    this.userName = userName;
    this.readOnly = readOnly;
  }
  public async read(): Promise<Snapshot> {
    return structuredClone(this.snapshot);
  }
  private assertWritable(): void {
    // 데모의 동작 제어입니다. 실제 운영 권한은 서버에서 별도로 검증해야 합니다.
    if (this.readOnly)
      throw new Error("읽기 전용 모드에서는 변경할 수 없습니다.");
  }
  private find(id: string): WorkItem {
    const parsedId = workSchema.shape.id.parse(id);
    const item = this.snapshot.items.find((entry) => entry.id === parsedId);
    if (!item) throw new Error("업무를 찾을 수 없습니다.");
    return item;
  }
  private log(item: WorkItem, type: Activity["type"], message: string): void {
    this.snapshot.logs.unshift({
      id: crypto.randomUUID(),
      workId: item.id,
      title: item.title,
      actor: this.userName,
      type,
      message,
      at: new Date().toISOString(),
    });
  }
  public async create(input: CreateWork): Promise<string> {
    this.assertWritable();
    const data = createWorkSchema.parse(input);
    const next =
      Math.max(...this.snapshot.items.map((item) => Number(item.id.slice(3)))) +
      1;
    const item = workSchema.parse({
      ...data,
      id: `WH-${next}`,
      owner: this.userName,
      status: "대기",
      progress: 0,
      createdAt: new Date().toISOString(),
      tags: ["신규 요청"],
    });
    this.snapshot.items.unshift(item);
    this.log(item, "등록", "새 업무를 등록했습니다.");
    return item.id;
  }
  public async changeStatus(id: string, nextStatus: Status): Promise<void> {
    this.assertWritable();
    const item = this.find(id);
    const next = statusSchema.parse(nextStatus);
    const before = item.status;
    if (before === next) return;
    item.status = next;
    item.progress =
      next === "완료"
        ? 100
        : next === "검토 중"
          ? 90
          : next === "진행 중"
            ? 35
            : 0;
    this.log(item, "상태 변경", `${before} → ${next}`);
  }
  public async comment(id: string, text: string): Promise<void> {
    this.assertWritable();
    this.log(this.find(id), "댓글", commentSchema.parse(text));
  }
  public async reset(): Promise<void> {
    this.assertWritable();
    this.snapshot = createSeed();
  }
}
