import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Activity as ActivityIcon,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Command,
  FolderKanban,
  Headset,
  LayoutDashboard,
  ListFilter,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Target,
  X,
  RotateCcw,
  Send,
  LockKeyhole,
} from "lucide-react";
import {
  Activity,
  AppOptions,
  CreateWork,
  Snapshot,
  Status,
  WorkItem,
  categorySchema,
  commentSchema,
  createWorkSchema,
  departmentSchema,
  prioritySchema,
  statusSchema,
} from "./_scheme/work";
import { DemoService } from "./_service/demoService";
import { useWorkspace } from "./_hooks/useWorkspace";
import { daysUntil, summary, weeklyCounts } from "./_util/metrics";
import { dateOnly } from "./_const/seed";

type View =
  "overview" | "all" | "프로젝트" | "IT 서비스" | "구매·지출" | "logs";
const viewNames: Record<View, string> = {
  overview: "통합 대시보드",
  all: "전체 업무",
  프로젝트: "프로젝트",
  "IT 서비스": "IT 서비스",
  "구매·지출": "구매·지출",
  logs: "활동 로그",
};
const money = (amount: number) => new Intl.NumberFormat("ko-KR").format(amount);
const stamp = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`wh-badge wh-status-${statusSchema.options.indexOf(status)}`}
    >
      <i />
      {status}
    </span>
  );
}
function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span
      className={`wh-avatar ${small ? "wh-avatar-small" : ""}`}
      aria-hidden="true"
    >
      {name.slice(-2)}
    </span>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="wh-empty">
      <Search size={28} />
      <strong>{text}</strong>
      <span>검색어나 필터를 변경해 보세요.</span>
    </div>
  );
}

function Modal({
  children,
  title,
  onClose,
  wide = false,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);
  React.useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`wh-dialog ${wide ? "wh-dialog-wide" : ""}`}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="wh-dialog-header">
        <span>{title}</span>
        <button className="wh-icon-button" aria-label="닫기" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}

function WorkTable({
  items,
  onOpen,
  compact = false,
}: {
  items: WorkItem[];
  onOpen: (id: string) => void;
  compact?: boolean;
}) {
  if (!items.length) return <Empty text="표시할 업무가 없습니다" />;
  return (
    <div className="wh-table-scroll">
      <table className="wh-table">
        <thead>
          <tr>
            <th>업무명</th>
            <th>상태</th>
            {!compact && <th>우선순위</th>}
            <th>담당자</th>
            <th>{compact ? "마감일" : "진행 현황"}</th>
            <th>
              <span className="wh-sr-only">상세</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <button
                  className="wh-task-link"
                  onClick={() => onOpen(item.id)}
                >
                  <span
                    className={`wh-task-icon wh-category-${categorySchema.options.indexOf(item.category)}`}
                  >
                    {item.category === "프로젝트" ? (
                      <FolderKanban size={18} />
                    ) : item.category === "IT 서비스" ? (
                      <Headset size={18} />
                    ) : (
                      <ShoppingBag size={18} />
                    )}
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      {item.id} <span>·</span> {item.category} <span>·</span>{" "}
                      {item.department}
                    </small>
                  </span>
                </button>
              </td>
              <td>
                <StatusBadge status={item.status} />
              </td>
              {!compact && (
                <td>
                  <span
                    className={`wh-priority wh-priority-${prioritySchema.options.indexOf(item.priority)}`}
                  >
                    <i />
                    {item.priority}
                  </span>
                </td>
              )}
              <td>
                <span className="wh-person">
                  <Avatar name={item.owner} small />
                  {item.owner}
                </span>
              </td>
              <td>
                {compact ? (
                  <span
                    className={
                      daysUntil(item.dueDate) < 0 && item.status !== "완료"
                        ? "wh-overdue"
                        : "wh-muted"
                    }
                  >
                    {item.dueDate.slice(5).replace("-", ".")}{" "}
                    {daysUntil(item.dueDate) < 0 && item.status !== "완료"
                      ? "지연"
                      : ""}
                  </span>
                ) : (
                  <span className="wh-progress-cell">
                    <span className="wh-progress">
                      <i style={{ width: `${item.progress}%` }} />
                    </span>
                    <small>{item.progress}%</small>
                  </span>
                )}
              </td>
              <td>
                <button
                  className="wh-icon-button"
                  aria-label={`${item.title} 상세 보기`}
                  onClick={() => onOpen(item.id)}
                >
                  <ChevronRight size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Dashboard({
  snapshot,
  onOpen,
  onView,
  onCreate,
  readOnly,
}: {
  snapshot: Snapshot;
  onOpen: (id: string) => void;
  onView: (view: View) => void;
  onCreate: () => void;
  readOnly: boolean;
}) {
  const stats = summary(snapshot.items);
  const chart = weeklyCounts(snapshot.items);
  const max = Math.max(3, ...chart.map((day) => day.created));
  const waiting = snapshot.items
    .filter(
      (item) =>
        item.status !== "완료" &&
        (item.priority === "긴급" || item.status === "검토 중"),
    )
    .slice(0, 3);
  const categories = categorySchema.options.map((category) => ({
    category,
    count: snapshot.items.filter((item) => item.category === category).length,
  }));
  return (
    <>
      <section className="wh-hero">
        <div className="wh-hero-copy">
          <span className="wh-eyebrow">
            <span className="wh-live-dot" />
            CONNECTED WORKSPACE
          </span>
          <h2>
            팀의 모든 일,
            <br />
            <em>하나의 흐름으로.</em>
          </h2>
          <p>
            프로젝트부터 IT 지원, 구매 승인까지.
            <br />
            업무의 시작과 끝을 한곳에서 연결하세요.
          </p>
          <button className="wh-hero-button" onClick={() => onView("all")}>
            전체 업무 살펴보기 <ArrowUpRight size={17} />
          </button>
        </div>
        <div className="wh-hero-art" aria-hidden="true">
          <div className="wh-orbit wh-orbit-one" />
          <div className="wh-orbit wh-orbit-two" />
          <div className="wh-orbit wh-orbit-three" />
          <div className="wh-art-center">
            <Command size={50} />
          </div>
          <div className="wh-art-tag wh-art-tag-one">
            <FolderKanban size={16} /> 프로젝트 <span>연결됨</span>
          </div>
          <div className="wh-art-tag wh-art-tag-two">
            <Headset size={16} /> IT 서비스 <Check size={15} />
          </div>
          <div className="wh-art-tag wh-art-tag-three">
            <ShoppingBag size={16} /> 구매 승인 <Check size={15} />
          </div>
          <span className="wh-art-caption">LESS FRICTION. MORE FLOW.</span>
        </div>
        <span className="wh-hero-index">WORKHUB / 01</span>
      </section>
      <div className="wh-kpis">
        {[
          {
            label: "전체 업무",
            value: stats.total,
            note: "세 업무 영역 통합",
            icon: BriefcaseBusiness,
            color: "navy",
          },
          {
            label: "진행 중",
            value: stats.active,
            note: `${stats.review}건 검토 대기`,
            icon: ActivityIcon,
            color: "blue",
          },
          {
            label: "완료한 업무",
            value: stats.complete,
            note: `전체 완료율 ${stats.rate}%`,
            icon: CheckCheck,
            color: "mint",
          },
          {
            label: "마감 확인 필요",
            value: stats.attention,
            note: "3일 이내 마감 · 지연 포함",
            icon: Clock3,
            color: "orange",
          },
        ].map((card) => (
          <section className="wh-kpi" key={card.label}>
            <div className="wh-row">
              <span>{card.label}</span>
              <span className={`wh-kpi-icon wh-tone-${card.color}`}>
                <card.icon size={18} />
              </span>
            </div>
            <strong>
              {card.value}
              <small>건</small>
            </strong>
            <p>{card.note}</p>
          </section>
        ))}
      </div>
      <div className="wh-dashboard-grid">
        <section className="wh-panel">
          <div className="wh-panel-heading">
            <div>
              <h3>업무 접수 추이</h3>
              <p>최근 7일 · 접수일 기준</p>
            </div>
            <span className="wh-period">
              <Clock3 size={13} /> 이번 주
            </span>
          </div>
          <div className="wh-chart-legend">
            <span>
              <i className="wh-legend-mint" />
              접수
            </span>
            <span>
              <i className="wh-legend-dark" />
              접수 건 중 현재 완료
            </span>
          </div>
          <div
            className="wh-bars"
            role="img"
            aria-label={chart
              .map(
                (day) =>
                  `${day.label} 접수 ${day.created}건, 현재 완료 ${day.complete}건`,
              )
              .join(", ")}
          >
            {chart.map((day) => (
              <div className="wh-bar-column" key={day.label}>
                <div className="wh-bar-pair">
                  <div
                    className="wh-bar wh-bar-created"
                    style={{ height: `${(day.created / max) * 100}%` }}
                  >
                    <span>{day.created}</span>
                  </div>
                  <div
                    className="wh-bar wh-bar-complete"
                    style={{ height: `${(day.complete / max) * 100}%` }}
                  >
                    <span>{day.complete}</span>
                  </div>
                </div>
                <small>{day.label}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="wh-panel">
          <div className="wh-panel-heading">
            <div>
              <h3>업무 포트폴리오</h3>
              <p>영역별 업무 비중</p>
            </div>
            <BarChart3 size={18} />
          </div>
          <div className="wh-donut-wrap">
            <div
              className="wh-donut"
              style={{
                background: `conic-gradient(#6dd7bd 0 ${(categories[0].count / stats.total) * 100}%, #152f3a ${(categories[0].count / stats.total) * 100}% ${((categories[0].count + categories[1].count) / stats.total) * 100}%, #afbbe9 ${((categories[0].count + categories[1].count) / stats.total) * 100}% 100%)`,
              }}
            >
              <div>
                <small>전체 업무</small>
                <strong>{stats.total}</strong>
              </div>
            </div>
          </div>
          <div className="wh-category-legend">
            {categories.map((entry, index) => (
              <button
                key={entry.category}
                onClick={() => onView(entry.category)}
              >
                <i className={`wh-dot-category-${index}`} />
                <span>{entry.category}</span>
                <strong>
                  {entry.count}
                  <small>건</small>
                </strong>
              </button>
            ))}
          </div>
        </section>
        <section className="wh-panel wh-attention">
          <div className="wh-panel-heading">
            <div>
              <h3>지금 확인할 업무</h3>
              <p>긴급 요청과 검토 대기</p>
            </div>
            <span className="wh-count">{waiting.length}</span>
          </div>
          {waiting.map((item) => (
            <button
              className="wh-attention-item"
              key={item.id}
              onClick={() => onOpen(item.id)}
            >
              <span className="wh-row">
                <small>{item.category}</small>
                <StatusBadge status={item.status} />
              </span>
              <strong>{item.title}</strong>
              <span className="wh-row">
                <span className="wh-person">
                  <Avatar name={item.owner} small />
                  {item.owner}
                </span>
                <ArrowUpRight size={15} />
              </span>
            </button>
          ))}
          {!waiting.length && (
            <p className="wh-muted">모든 검토를 마쳤습니다.</p>
          )}
        </section>
      </div>
      <section className="wh-panel wh-recent">
        <div className="wh-panel-heading">
          <div>
            <h3>최근 등록된 업무</h3>
            <p>팀의 새로운 움직임을 확인하세요.</p>
          </div>
          <button className="wh-text-button" onClick={() => onView("all")}>
            전체 보기 <ArrowRight size={15} />
          </button>
        </div>
        <WorkTable
          compact
          items={[...snapshot.items]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 4)}
          onOpen={onOpen}
        />
      </section>
      {!readOnly && (
        <button className="wh-mobile-create wh-primary" onClick={onCreate}>
          <Plus size={18} />새 업무
        </button>
      )}
    </>
  );
}

function ListView({
  items,
  query,
  onQuery,
  onOpen,
  category,
}: {
  items: WorkItem[];
  query: string;
  onQuery: (value: string) => void;
  onOpen: (id: string) => void;
  category?: WorkItem["category"];
}) {
  const [status, setStatus] = React.useState<Status | "전체">("전체");
  const [priority, setPriority] = React.useState("전체");
  const [sort, setSort] = React.useState("recent");
  const [page, setPage] = React.useState(0);
  React.useEffect(() => setPage(0), [query, status, priority, category]);
  const source = category
    ? items.filter((item) => item.category === category)
    : items;
  const filtered = source
    .filter(
      (item) =>
        (status === "전체" || item.status === status) &&
        (priority === "전체" || item.priority === priority) &&
        `${item.title} ${item.id} ${item.owner} ${item.department} ${item.vendor}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "due"
        ? a.dueDate.localeCompare(b.dueDate)
        : sort === "priority"
          ? prioritySchema.options.indexOf(a.priority) -
            prioritySchema.options.indexOf(b.priority)
          : b.createdAt.localeCompare(a.createdAt),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const current = Math.min(page, pages - 1);
  const totalAmount = source.reduce((sum, item) => sum + item.amount, 0);
  return (
    <>
      <div className="wh-section-summary">
        <div>
          <span
            className={`wh-section-symbol wh-category-${category ? categorySchema.options.indexOf(category) : 0}`}
          >
            {category === "IT 서비스" ? (
              <Headset size={25} />
            ) : category === "구매·지출" ? (
              <ShoppingBag size={25} />
            ) : (
              <FolderKanban size={25} />
            )}
          </span>
          <span>
            <strong>
              {category === "IT 서비스"
                ? "더 빠르게 해결하고, 더 안정적으로."
                : category === "구매·지출"
                  ? "필요한 구매를, 투명한 절차로."
                  : "좋은 아이디어가 성과가 되는 곳."}
            </strong>
            <p>
              {category === "구매·지출"
                ? `총 요청 금액 ₩${money(totalAmount)} · 시연용 가상 거래`
                : `전체 ${source.length}건 · 완료 ${source.filter((item) => item.status === "완료").length}건`}
            </p>
          </span>
        </div>
        <span className="wh-outline-tag">{category || "ALL WORK"}</span>
      </div>
      <section className="wh-panel wh-list-panel">
        <div className="wh-tabs">
          {(["전체", ...statusSchema.options] as const).map((value) => (
            <button
              key={value}
              className={status === value ? "active" : ""}
              onClick={() => setStatus(value)}
            >
              {value}
              <span>
                {value === "전체"
                  ? source.length
                  : source.filter((item) => item.status === value).length}
              </span>
            </button>
          ))}
        </div>
        <div className="wh-list-tools">
          <label className="wh-search">
            <Search size={17} />
            <input
              aria-label="업무 검색"
              placeholder="업무명, 번호, 담당자 검색"
              value={query}
              onChange={(event) => onQuery(event.target.value)}
            />
            {query && (
              <button aria-label="검색 지우기" onClick={() => onQuery("")}>
                <X size={15} />
              </button>
            )}
          </label>
          <div className="wh-tool-select">
            <ListFilter size={15} />
            <select
              aria-label="우선순위 필터"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="전체">모든 우선순위</option>
              {prioritySchema.options.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
          <select
            className="wh-select"
            aria-label="업무 정렬"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="recent">최신 등록순</option>
            <option value="due">마감 임박순</option>
            <option value="priority">우선순위순</option>
          </select>
        </div>
        <WorkTable
          items={filtered.slice(current * 8, current * 8 + 8)}
          onOpen={onOpen}
        />
        <footer className="wh-pagination">
          <span>
            전체 {filtered.length}건 중 {filtered.length ? current * 8 + 1 : 0}–
            {Math.min((current + 1) * 8, filtered.length)}건
          </span>
          <div>
            <button
              className="wh-icon-button"
              aria-label="이전 페이지"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              {current + 1} / {pages}
            </span>
            <button
              className="wh-icon-button"
              aria-label="다음 페이지"
              disabled={current + 1 >= pages}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </section>
    </>
  );
}

function ActivityList({
  logs,
  onOpen,
  full = false,
}: {
  logs: Activity[];
  onOpen?: (id: string) => void;
  full?: boolean;
}) {
  return (
    <div className={`wh-timeline ${full ? "wh-timeline-full" : ""}`}>
      {logs.length ? (
        logs.map((log) => (
          <article className="wh-timeline-entry" key={log.id}>
            <span
              className={`wh-event-icon wh-event-${log.type === "댓글" ? "comment" : log.type === "상태 변경" ? "change" : "create"}`}
            >
              {log.type === "댓글" ? (
                <MessageSquare size={15} />
              ) : log.type === "상태 변경" ? (
                <ArrowRight size={15} />
              ) : (
                <Plus size={15} />
              )}
            </span>
            <div>
              <div className="wh-row">
                <span>
                  <strong>{log.actor}</strong>
                  <span className="wh-event-kind">{log.type}</span>
                </span>
                <time>{stamp(log.at)}</time>
              </div>
              {full && (
                <button
                  className="wh-log-title"
                  onClick={() => onOpen?.(log.workId)}
                >
                  {log.title}
                  <ArrowUpRight size={13} />
                </button>
              )}
              <p>{log.message}</p>
              {full && <small>{log.workId}</small>}
            </div>
          </article>
        ))
      ) : (
        <div className="wh-empty">
          <ActivityIcon />
          <strong>아직 활동이 없습니다</strong>
        </div>
      )}
    </div>
  );
}

function CreateForm({
  category,
  onSave,
  pending,
  error,
  onClose,
}: {
  category: WorkItem["category"];
  onSave: (data: CreateWork) => void;
  pending: boolean;
  error: string;
  onClose: () => void;
}) {
  const due = new Date();
  due.setDate(due.getDate() + 7);
  const [draft, setDraft] = React.useState<CreateWork>({
    title: "",
    description: "",
    department: "디지털혁신",
    priority: "보통",
    category,
    dueDate: dateOnly(due),
    service: "",
    impact: "개인",
    amount: 0,
    vendor: "",
  });
  const [validation, setValidation] = React.useState("");
  const set = <K extends keyof CreateWork>(key: K, value: CreateWork[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return (
    <form
      className="wh-form"
      onSubmit={(event) => {
        event.preventDefault();
        const result = createWorkSchema.safeParse(draft);
        if (!result.success) {
          setValidation(result.error.issues[0].message);
          return;
        }
        setValidation("");
        onSave(result.data);
      }}
    >
      <div className="wh-form-intro">
        <span className="wh-form-symbol">
          <Plus size={24} />
        </span>
        <h2>새로운 일을 시작하세요</h2>
        <p>필요한 내용을 남기면 팀의 업무 흐름에 연결됩니다.</p>
      </div>
      <div className="wh-choice-group">
        {categorySchema.options.map((value) => (
          <button
            key={value}
            type="button"
            className={draft.category === value ? "active" : ""}
            onClick={() => set("category", value)}
          >
            {value}
          </button>
        ))}
      </div>
      <label>
        업무명 <span>*</span>
        <input
          autoFocus
          value={draft.title}
          maxLength={80}
          placeholder="어떤 일을 진행할까요?"
          onChange={(event) => set("title", event.target.value)}
          required
        />
      </label>
      <div className="wh-form-grid">
        <label>
          요청 부서
          <select
            value={draft.department}
            onChange={(event) =>
              set("department", departmentSchema.parse(event.target.value))
            }
          >
            {departmentSchema.options.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          마감일
          <input
            type="date"
            value={draft.dueDate}
            onChange={(event) => set("dueDate", event.target.value)}
            required
          />
        </label>
      </div>
      <label>
        업무 설명 <span>*</span>
        <textarea
          rows={3}
          maxLength={1200}
          value={draft.description}
          placeholder="목적, 필요한 지원, 기대 결과를 알려주세요. (10자 이상)"
          onChange={(event) => set("description", event.target.value)}
          required
        />
      </label>
      <div className="wh-form-grid">
        <label>
          우선순위
          <select
            value={draft.priority}
            onChange={(event) =>
              set("priority", prioritySchema.parse(event.target.value))
            }
          >
            {prioritySchema.options.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        {draft.category === "IT 서비스" && (
          <label>
            영향 범위
            <select
              value={draft.impact}
              onChange={(event) =>
                set(
                  "impact",
                  event.target.value === "전사"
                    ? "전사"
                    : event.target.value === "부서"
                      ? "부서"
                      : "개인",
                )
              }
            >
              <option>개인</option>
              <option>부서</option>
              <option>전사</option>
            </select>
          </label>
        )}
      </div>
      {draft.category === "IT 서비스" && (
        <label>
          대상 서비스 <span>*</span>
          <input
            value={draft.service}
            maxLength={60}
            placeholder="예: 업무 포털, VPN, Microsoft 365"
            onChange={(event) => set("service", event.target.value)}
            required
          />
        </label>
      )}
      {draft.category === "구매·지출" && (
        <div className="wh-form-grid">
          <label>
            요청 금액 (원) <span>*</span>
            <input
              type="number"
              min={1}
              max={1000000000}
              step={1}
              value={draft.amount || ""}
              onChange={(event) => set("amount", Number(event.target.value))}
              required
            />
          </label>
          <label>
            거래처 <span>*</span>
            <input
              maxLength={80}
              value={draft.vendor}
              placeholder="거래처명"
              onChange={(event) => set("vendor", event.target.value)}
              required
            />
          </label>
        </div>
      )}
      <p className="wh-error" role="alert">
        {validation || error}
      </p>
      <footer className="wh-form-footer">
        <button className="wh-secondary" type="button" onClick={onClose}>
          취소
        </button>
        <button className="wh-primary" type="submit" disabled={pending}>
          {pending ? "등록 중…" : "업무 등록"}
          <ArrowRight size={16} />
        </button>
      </footer>
    </form>
  );
}

function Detail({
  item,
  logs,
  userName,
  readOnly,
  onStatus,
  onComment,
  pending,
  error,
}: {
  item: WorkItem;
  logs: Activity[];
  userName: string;
  readOnly: boolean;
  onStatus: (status: Status) => void;
  onComment: (text: string, done: () => void) => void;
  pending: boolean;
  error: string;
}) {
  const [tab, setTab] = React.useState<"overview" | "history">("overview");
  const [comment, setComment] = React.useState("");
  const [validation, setValidation] = React.useState("");
  const next =
    statusSchema.options[
      Math.min(statusSchema.options.indexOf(item.status) + 1, 3)
    ];
  return (
    <>
      <div className="wh-detail-title">
        <div className="wh-row">
          <span className="wh-detail-id">
            {item.id} <span>/</span> {item.category}
          </span>
          <StatusBadge status={item.status} />
        </div>
        <h2>{item.title}</h2>
        <div className="wh-tags">
          {item.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </div>
      <div className="wh-detail-layout">
        <div className="wh-detail-main">
          <div className="wh-tabs">
            <button
              className={tab === "overview" ? "active" : ""}
              onClick={() => setTab("overview")}
            >
              업무 상세
            </button>
            <button
              className={tab === "history" ? "active" : ""}
              onClick={() => setTab("history")}
            >
              활동 기록<span>{logs.length}</span>
            </button>
          </div>
          {tab === "overview" ? (
            <>
              <section className="wh-detail-section">
                <h3>요청 내용</h3>
                <p>{item.description}</p>
              </section>
              <section className="wh-detail-section">
                <div className="wh-row">
                  <h3>진행 단계</h3>
                  <strong className="wh-teal">{item.progress}%</strong>
                </div>
                <div className="wh-stepper">
                  {statusSchema.options.map((status, index) => (
                    <div
                      key={status}
                      className={
                        index <= statusSchema.options.indexOf(item.status)
                          ? "active"
                          : ""
                      }
                    >
                      <span>
                        {index < statusSchema.options.indexOf(item.status) ? (
                          <Check size={14} />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <small>{status}</small>
                    </div>
                  ))}
                </div>
              </section>
              {item.category === "IT 서비스" && (
                <div className="wh-domain-info">
                  <Headset size={22} />
                  <div>
                    <strong>{item.service}</strong>
                    <p>
                      영향 범위: {item.impact} · 우선순위: {item.priority}
                    </p>
                  </div>
                </div>
              )}
              {item.category === "구매·지출" && (
                <div className="wh-purchase-card">
                  <span>총 요청 금액</span>
                  <strong>₩{money(item.amount)}</strong>
                  <p>
                    {item.vendor} ·{" "}
                    {item.status === "완료"
                      ? "승인 완료 (데모)"
                      : "승인 절차 진행 중 (데모)"}
                  </p>
                </div>
              )}
              <section className="wh-detail-section">
                <h3>최근 활동</h3>
                <ActivityList logs={logs.slice(0, 3)} />
              </section>
            </>
          ) : (
            <div className="wh-detail-section">
              <ActivityList logs={logs} />
            </div>
          )}
          {!readOnly && (
            <form
              className="wh-comment-form"
              onSubmit={(event) => {
                event.preventDefault();
                const result = commentSchema.safeParse(comment);
                if (!result.success) {
                  setValidation(result.error.issues[0].message);
                  return;
                }
                setValidation("");
                onComment(result.data, () => setComment(""));
              }}
            >
              <Avatar name={userName} small />
              <textarea
                aria-label="댓글 입력"
                rows={2}
                maxLength={500}
                placeholder="팀에 공유할 내용을 남겨주세요."
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
              <button
                className="wh-icon-button"
                aria-label="댓글 등록"
                disabled={pending || !comment.trim()}
              >
                <Send size={18} />
              </button>
            </form>
          )}
          <p className="wh-error" role="alert">
            {validation || error}
          </p>
        </div>
        <aside className="wh-detail-aside">
          <h3>업무 정보</h3>
          <dl>
            <dt>담당자</dt>
            <dd>
              <Avatar name={item.owner} small />
              {item.owner}
            </dd>
            <dt>요청 부서</dt>
            <dd>{item.department}</dd>
            <dt>우선순위</dt>
            <dd>
              <span
                className={`wh-priority wh-priority-${prioritySchema.options.indexOf(item.priority)}`}
              >
                <i />
                {item.priority}
              </span>
            </dd>
            <dt>마감일</dt>
            <dd>
              {item.dueDate.replaceAll("-", ".")}{" "}
              {daysUntil(item.dueDate) < 0 && item.status !== "완료" && (
                <span className="wh-overdue">지연</span>
              )}
            </dd>
            <dt>등록일</dt>
            <dd>{stamp(item.createdAt)}</dd>
          </dl>
          {!readOnly && (
            <div className="wh-detail-actions">
              <label>
                상태 변경
                <select
                  aria-label="상태 변경"
                  value={item.status}
                  disabled={pending}
                  onChange={(event) =>
                    onStatus(statusSchema.parse(event.target.value))
                  }
                >
                  {statusSchema.options.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              {item.status !== "완료" && (
                <button
                  className="wh-primary"
                  disabled={pending}
                  onClick={() => onStatus(next)}
                >
                  {next === "완료"
                    ? item.category === "구매·지출"
                      ? "승인 완료 (데모)"
                      : "업무 완료"
                    : `${next}(으)로 이동`}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}
          <div className="wh-info-note">
            <ShieldCheck size={18} />
            <p>
              변경 사항은 활동 기록에 남습니다. 이 데모의 데이터는 실행 중에만
              유지됩니다.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

function Workspace({
  options,
  service,
}: {
  options: AppOptions;
  service: DemoService;
}) {
  const data = useWorkspace(service);
  const [view, setView] = React.useState<View>("overview");
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [help, setHelp] = React.useState(false);
  const [resetConfirm, setResetConfirm] = React.useState(false);
  const [toast, setToast] = React.useState("");
  const [logFilter, setLogFilter] = React.useState("전체");
  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  const open = (id: string) => {
    data.change.reset();
    data.comment.reset();
    setSelected(id);
    options.onSelection(id);
  };
  const navigate = (next: View) => {
    setView(next);
    setQuery("");
  };
  const item = data.data?.items.find((entry) => entry.id === selected);
  const nav: { view: View; icon: typeof LayoutDashboard; label: string }[] = [
    { view: "overview", icon: LayoutDashboard, label: "통합 대시보드" },
    { view: "all", icon: BriefcaseBusiness, label: "전체 업무" },
    { view: "프로젝트", icon: FolderKanban, label: "프로젝트" },
    { view: "IT 서비스", icon: Headset, label: "IT 서비스" },
    { view: "구매·지출", icon: ShoppingBag, label: "구매·지출" },
    { view: "logs", icon: ActivityIcon, label: "활동 로그" },
  ];
  return (
    <div className="wh-shell">
      <aside className="wh-sidebar">
        <a
          className="wh-brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            navigate("overview");
          }}
        >
          <span>
            <Command size={25} />
          </span>
          workhub<span className="wh-brand-dot">.</span>
        </a>
        <div className="wh-workspace-label">
          <span className="wh-workspace-icon">W</span>
          <div>
            <strong>우리 팀 워크스페이스</strong>
            <small>Enterprise demo</small>
          </div>
          <ChevronDown size={13} />
        </div>
        <span className="wh-nav-caption">WORKSPACE</span>
        <nav aria-label="주 메뉴">
          {nav.map((entry) => (
            <button
              key={entry.view}
              aria-label={entry.label}
              className={view === entry.view ? "active" : ""}
              onClick={() => navigate(entry.view)}
            >
              <entry.icon size={18} />
              <span>{entry.label}</span>
              {entry.view === "all" && (
                <small>{data.data?.items.length || 0}</small>
              )}
            </button>
          ))}
        </nav>
        <div className="wh-sidebar-bottom">
          <div className="wh-demo-card">
            <Sparkles size={19} />
            <strong>아이디어에서 앱으로</strong>
            <p>
              바이브 코딩으로 완성한
              <br />
              우리 팀의 새로운 업무 경험.
            </p>
            <button onClick={() => setHelp(true)}>
              데모 알아보기 <ArrowUpRight size={14} />
            </button>
          </div>
          <button className="wh-help" onClick={() => setHelp(true)}>
            <CircleHelp size={17} />
            사용 가이드
          </button>
          <div className="wh-profile">
            <Avatar name={options.userName} />
            <div>
              <strong>{options.userName}</strong>
              <small>
                {options.readOnly ? "읽기 전용 데모" : "데모 관리자"}
              </small>
            </div>
            <ShieldCheck size={16} />
          </div>
        </div>
      </aside>
      <div className="wh-workspace">
        <header className="wh-topbar">
          <div>
            <span>워크스페이스</span>
            <ChevronRight size={13} />
            <strong>{viewNames[view]}</strong>
          </div>
          <div>
            <span className="wh-demo-label">
              <i />
              LIVE DEMO
            </span>
            <span className="wh-top-divider" />
            <button
              className="wh-icon-button"
              aria-label="사용 가이드"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={19} />
            </button>
            <Avatar name={options.userName} small />
          </div>
        </header>
        <main className="wh-main">
          <header className="wh-page-heading">
            <div>
              <span className="wh-eyebrow">
                {view === "overview"
                  ? "YOUR WORK, CONNECTED"
                  : view === "logs"
                    ? "EVERY CHANGE, IN CONTEXT"
                    : "MAKE GREAT WORK HAPPEN"}
              </span>
              <h1>
                {viewNames[view]}
                <span className="wh-title-dot">.</span>
              </h1>
              <p>
                {view === "overview"
                  ? "오늘도 좋은 흐름으로, 팀의 업무를 한눈에 확인하세요."
                  : view === "logs"
                    ? "등록부터 완료까지, 팀의 모든 움직임을 기록합니다."
                    : "업무를 찾고, 진행 상황을 확인하고, 다음 단계를 연결하세요."}
              </p>
            </div>
            <div className="wh-heading-actions">
              <span className="wh-today">
                {new Intl.DateTimeFormat("ko-KR", {
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                }).format(new Date())}
              </span>
              {!options.readOnly && (
                <button
                  className="wh-primary"
                  onClick={() => {
                    data.create.reset();
                    setCreating(true);
                  }}
                >
                  <Plus size={17} />새 업무 등록
                </button>
              )}
            </div>
          </header>
          {data.isPending ? (
            <div className="wh-empty">
              <span className="wh-loader" />
              워크스페이스 준비 중…
            </div>
          ) : data.isError ? (
            <div className="wh-empty" role="alert">
              <strong>업무를 불러오지 못했습니다.</strong>
              <button
                className="wh-secondary"
                onClick={() => {
                  void data.refetch();
                }}
              >
                다시 시도
              </button>
            </div>
          ) : (
            data.data && (
              <>
                {view === "overview" ? (
                  <Dashboard
                    snapshot={data.data}
                    onOpen={open}
                    onView={navigate}
                    onCreate={() => setCreating(true)}
                    readOnly={options.readOnly}
                  />
                ) : view === "logs" ? (
                  <section className="wh-panel wh-log-panel">
                    <div className="wh-panel-heading">
                      <div>
                        <h3>워크스페이스 활동</h3>
                        <p>
                          총 {data.data.logs.length}개의 기록 · 현재 실행 세션
                        </p>
                      </div>
                      <select
                        className="wh-select"
                        aria-label="활동 유형"
                        value={logFilter}
                        onChange={(event) => setLogFilter(event.target.value)}
                      >
                        <option>전체</option>
                        <option>등록</option>
                        <option>상태 변경</option>
                        <option>댓글</option>
                      </select>
                    </div>
                    <ActivityList
                      full
                      logs={data.data.logs.filter(
                        (log) => logFilter === "전체" || log.type === logFilter,
                      )}
                      onOpen={open}
                    />
                  </section>
                ) : (
                  <ListView
                    key={view}
                    items={data.data.items}
                    query={query}
                    onQuery={setQuery}
                    onOpen={open}
                    category={view === "all" ? undefined : view}
                  />
                )}
              </>
            )
          )}
          <footer className="wh-page-footer">
            <span>
              WORKHUB <i /> POWER APPS EXPERIENCE
            </span>
            <span>가상 데이터 · 세션 내 저장 · MCP 미사용 데모</span>
          </footer>
        </main>
      </div>
      {item && data.data && (
        <Modal title="업무 상세" wide onClose={() => setSelected(null)}>
          <Detail
            item={item}
            logs={data.data.logs.filter((log) => log.workId === item.id)}
            userName={options.userName}
            readOnly={options.readOnly}
            pending={data.change.isPending || data.comment.isPending}
            error={
              data.change.error?.message || data.comment.error?.message || ""
            }
            onStatus={(status) =>
              data.change.mutate(
                { id: item.id, status },
                {
                  onSuccess: () =>
                    setToast("상태를 변경하고 활동 기록에 남겼습니다."),
                },
              )
            }
            onComment={(text, done) =>
              data.comment.mutate(
                { id: item.id, text },
                {
                  onSuccess: () => {
                    done();
                    setToast("댓글을 등록했습니다.");
                  },
                },
              )
            }
          />
        </Modal>
      )}
      {creating && !options.readOnly && (
        <Modal title="새 업무 등록" onClose={() => setCreating(false)}>
          <CreateForm
            category={
              view === "IT 서비스" || view === "구매·지출" ? view : "프로젝트"
            }
            pending={data.create.isPending}
            error={data.create.error?.message || ""}
            onClose={() => setCreating(false)}
            onSave={(draft) =>
              data.create.mutate(draft, {
                onSuccess: (id) => {
                  setCreating(false);
                  open(id);
                  setToast("새 업무가 등록되었습니다.");
                },
              })
            }
          />
        </Modal>
      )}
      {help && (
        <Modal
          title="WorkHub 데모 가이드"
          onClose={() => {
            setHelp(false);
            setResetConfirm(false);
          }}
        >
          <div className="wh-guide">
            <div className="wh-guide-mark">
              <Command size={34} />
            </div>
            <h2>이게 정말 Canvas 앱이라고요?</h2>
            <p>
              프로젝트, IT 서비스, 구매 승인을 하나의 PCF 코드 구성 요소로
              구현한 시연용 앱입니다. 같은 화면 코드를 Power Apps Canvas 앱과
              로컬 미리보기에서 사용합니다.
            </p>
            <ol>
              <li>
                <strong>한눈에 보기</strong>
                <span>대시보드에서 세 업무 영역과 진행 현황을 확인하세요.</span>
              </li>
              <li>
                <strong>업무 탐색</strong>
                <span>목록에서 검색·필터를 적용하고 상세 화면을 여세요.</span>
              </li>
              <li>
                <strong>함께 진행하기</strong>
                <span>
                  새 업무를 등록하고 상태를 변경하거나 댓글을 남기세요.
                </span>
              </li>
              <li>
                <strong>변화 확인하기</strong>
                <span>대시보드 집계와 활동 로그가 함께 바뀝니다.</span>
              </li>
            </ol>
            <div className="wh-guide-note">
              <LockKeyhole size={18} />
              <p>
                실제 MCP·AI·결제·승인 서버를 호출하지 않습니다. 모든 데이터는
                가상이며 앱을 다시 열면 초기화됩니다. 운영 전환 시 서버 검증과
                실제 권한·저장소 연동이 필요합니다.
              </p>
            </div>
            {!options.readOnly && (
              <div className="wh-reset">
                {resetConfirm ? (
                  <>
                    <p>이번 실행에서 변경한 데모 데이터를 초기화할까요?</p>
                    <button
                      className="wh-secondary"
                      onClick={() => setResetConfirm(false)}
                    >
                      취소
                    </button>
                    <button
                      className="wh-primary"
                      disabled={data.reset.isPending}
                      onClick={() =>
                        data.reset.mutate(undefined, {
                          onSuccess: () => {
                            setResetConfirm(false);
                            setHelp(false);
                            navigate("overview");
                            setToast("데모 데이터를 초기화했습니다.");
                          },
                        })
                      }
                    >
                      초기화
                    </button>
                  </>
                ) : (
                  <button
                    className="wh-text-button"
                    onClick={() => setResetConfirm(true)}
                  >
                    <RotateCcw size={15} />
                    데모 데이터 초기화
                  </button>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
      {toast && (
        <div className="wh-toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}

export function WorkHubApp(options: AppOptions) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );
  const [service] = React.useState(
    () => new DemoService(options.userName, options.readOnly),
  );
  service.userName = options.userName;
  service.readOnly = options.readOnly;
  return (
    <QueryClientProvider client={queryClient}>
      <Workspace options={options} service={service} />
    </QueryClientProvider>
  );
}
