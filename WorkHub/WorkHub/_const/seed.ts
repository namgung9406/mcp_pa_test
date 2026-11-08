import {
  Activity,
  Snapshot,
  WorkItem,
  statusSchema,
  prioritySchema,
  departmentSchema,
  categorySchema,
} from "../_scheme/work";

export function dateOnly(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}
export function createSeed(): Snapshot {
  const now = new Date();
  const titles = [
    "고객 온보딩 프로세스 자동화",
    "전사 디자인 시스템 구축",
    "클라우드 비용 최적화 대시보드",
    "신규 입사자 웰컴 키트 개선",
    "고객 상담 지식베이스 통합",
    "사내 자산 관리 앱 고도화",
    "분기별 성과 리포트 자동화",
    "모바일 근태 서비스 개선",
    "서비스 품질 모니터링 체계 구축",
    "구매 승인 워크플로 정비",
    "고객 피드백 분석 프로젝트",
    "통합 계정 관리 체계 개선",
    "프로젝트 운영 가이드 제작",
    "부서별 업무 현황 시각화",
    "내부 고객 만족도 조사",
    "회의실 예약 경험 개선",
    "파트너 협업 포털 구축",
    "전자계약 관리 프로세스 개선",
    "VOC 분류 체계 표준화",
    "운영 매뉴얼 검색 서비스",
    "업무 요청 템플릿 표준화",
    "월별 예산 집행 현황 통합",
    "서비스 이용 가이드 제작",
    "보안 점검 체크리스트 개편",
  ];
  const owners = ["김민서", "이준호", "박서연", "정지우"];
  const items: WorkItem[] = titles.map((title, index) => {
    const created = new Date(now);
    created.setDate(
      created.getDate() -
        [
          0, 0, 1, 1, 1, 2, 3, 3, 4, 4, 4, 4, 5, 5, 6, 6, 6, 8, 10, 14, 18, 20,
          25, 27,
        ][index],
    );
    created.setHours(9 + (index % 8), (index * 7) % 60, 0, 0);
    if (created > now) created.setDate(created.getDate() - 1);
    const due = new Date(now);
    due.setDate(due.getDate() + ((index * 2) % 16) - 2);
    const status = statusSchema.options[[1, 2, 1, 0, 3, 1, 3, 2][index % 8]];
    const category = categorySchema.options[index % 3];
    const categoryTitle =
      category === "IT 서비스"
        ? [
            "업무 포털 접속 지연 개선",
            "VPN 연결 오류 지원",
            "메일 동기화 장애 조치",
            "노트북 보안 업데이트",
            "회의실 화상회의 장비 점검",
            "ERP 권한 요청",
            "사내 Wi-Fi 품질 개선",
            "공유 드라이브 접근 복구",
          ][Math.floor(index / 3)]
        : category === "구매·지출"
          ? [
              "디자인 협업 도구 라이선스",
              "개발팀 노트북 구매",
              "신규 입사자 모니터 구매",
              "클라우드 서비스 이용료",
              "고객 인터뷰 리서치 비용",
              "팀 워크숍 운영비",
              "보안 솔루션 갱신",
              "업무용 소프트웨어 구독",
            ][Math.floor(index / 3)]
          : title;
    return {
      id: `WH-${1048 - index}`,
      title: categoryTitle,
      category,
      service:
        category === "IT 서비스"
          ? ["업무 포털", "네트워크", "Microsoft 365", "사내 장비"][
              Math.floor(index / 3) % 4
            ]
          : "",
      impact: index % 4 === 1 ? "전사" : "부서",
      amount:
        category === "구매·지출"
          ? [
              2400000, 9600000, 1800000, 3400000, 850000, 1200000, 6800000,
              720000,
            ][Math.floor(index / 3)]
          : 0,
      vendor:
        category === "구매·지출"
          ? ["그린테크 (가상)", "모던워크 (가상)", "넥스트솔루션 (가상)"][
              index % 3
            ]
          : "",
      description: `${categoryTitle} 요청입니다. 현황과 요구사항을 확인한 뒤 담당 부서에서 검토하고 진행합니다. 완료 시 결과를 공유하고 요청자 확인을 거쳐 종료할 예정입니다. 모든 인물과 거래처는 시연용 가상 데이터입니다.`,
      department: departmentSchema.options[index % 4],
      owner: owners[index % 4],
      status,
      priority:
        prioritySchema.options[index % 7 === 0 ? 0 : index % 3 === 0 ? 1 : 2],
      progress:
        status === "완료"
          ? 100
          : status === "검토 중"
            ? 90
            : status === "대기"
              ? 0
              : [35, 65, 72][index % 3],
      createdAt: created.toISOString(),
      dueDate: dateOnly(due),
      tags: [category, index % 3 === 0 ? "핵심 과제" : "협업"],
    };
  });
  const logs: Activity[] = items
    .map<Activity>((item, index) => ({
      id: `seed-${index}`,
      workId: item.id,
      title: item.title,
      actor: item.owner,
      type: "등록",
      message: "새 업무를 등록했습니다.",
      at: item.createdAt,
    }))
    .sort((a, b) => b.at.localeCompare(a.at));
  const changes: Activity[] = items
    .filter((item) => item.status !== "대기")
    .map((item) => ({
      id: `status-${item.id}`,
      workId: item.id,
      title: item.title,
      actor: item.owner,
      type: "상태 변경",
      message: `대기 → ${item.status}`,
      at: new Date(
        Math.min(
          new Date(item.createdAt).getTime() + 2 * 3600000,
          now.getTime(),
        ),
      ).toISOString(),
    }));
  return {
    items,
    logs: [...changes, ...logs].sort((a, b) => b.at.localeCompare(a.at)),
  };
}
