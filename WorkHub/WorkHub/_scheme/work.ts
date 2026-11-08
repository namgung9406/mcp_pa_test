import { z } from "zod";

export const statusSchema = z.enum(["대기", "진행 중", "검토 중", "완료"]);
export const prioritySchema = z.enum(["긴급", "높음", "보통"]);
export const departmentSchema = z.enum([
  "디지털혁신",
  "경영지원",
  "고객경험",
  "IT운영",
]);
export const categorySchema = z.enum(["프로젝트", "IT 서비스", "구매·지출"]);
export const workSchema = z.object({
  id: z.string().regex(/^WH-\d{4,}$/),
  title: z.string().trim().min(3, "업무명은 3자 이상 입력해 주세요.").max(80),
  description: z
    .string()
    .trim()
    .min(10, "설명은 10자 이상 입력해 주세요.")
    .max(1200),
  department: departmentSchema,
  category: categorySchema,
  service: z.string().trim().max(60),
  impact: z.enum(["개인", "부서", "전사"]),
  amount: z.number().int().min(0).max(1000000000),
  vendor: z.string().trim().max(80),
  owner: z.string().min(1).max(40),
  status: statusSchema,
  priority: prioritySchema,
  progress: z.number().int().min(0).max(100),
  createdAt: z.string().datetime(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tags: z.array(z.string().max(30)).max(5),
});
export type WorkItem = z.infer<typeof workSchema>;
export type WorkSummary = Pick<
  WorkItem,
  "id" | "title" | "status" | "priority"
>;
export type Status = WorkItem["status"];
export type Priority = WorkItem["priority"];
export const createWorkSchema = workSchema
  .pick({
    title: true,
    description: true,
    department: true,
    priority: true,
    dueDate: true,
    category: true,
    service: true,
    impact: true,
    amount: true,
    vendor: true,
  })
  .superRefine((value, ctx) => {
    if (value.category === "구매·지출" && (value.amount < 1 || !value.vendor))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "구매 요청에는 1원 이상의 금액과 거래처가 필요합니다.",
      });
    if (value.category === "IT 서비스" && !value.service)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "IT 요청에는 대상 서비스가 필요합니다.",
      });
    const date = new Date(`${value.dueDate}T00:00:00`);
    if (
      Number.isNaN(date.getTime()) ||
      date.getFullYear() !== Number(value.dueDate.slice(0, 4)) ||
      date.getMonth() + 1 !== Number(value.dueDate.slice(5, 7)) ||
      date.getDate() !== Number(value.dueDate.slice(8, 10))
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "올바른 마감일을 입력해 주세요.",
      });
  });
export type CreateWork = z.infer<typeof createWorkSchema>;
export const logSchema = z.object({
  id: z.string(),
  workId: workSchema.shape.id,
  title: z.string(),
  actor: z.string(),
  type: z.enum(["등록", "상태 변경", "댓글"]),
  message: z.string(),
  at: z.string().datetime(),
});
export type Activity = z.infer<typeof logSchema>;
export const commentSchema = z
  .string()
  .trim()
  .min(2, "댓글은 2자 이상 입력해 주세요.")
  .max(500, "댓글은 500자 이하로 입력해 주세요.");
export interface Snapshot {
  items: WorkItem[];
  logs: Activity[];
}
export interface AppOptions {
  userName: string;
  readOnly: boolean;
  onSelection: (id: string) => void;
}
