type TimelineItem = {
  id: string;
  title: string;
  description?: string | null;
  timestamp: string;
  sortDate?: string | Date | null;
  tone?: "slate" | "blue" | "amber" | "green" | "red";
  badge?: string | null;
};

type Props = {
  items: TimelineItem[];
};

type GroupedDay = {
  key: string;
  label: string;
  items: TimelineItem[];
};

function getToneClasses(tone: TimelineItem["tone"] = "slate") {
  switch (tone) {
    case "blue":
      return {
        dot: "bg-blue-600",
        iconWrap: "bg-blue-50 text-blue-700 border-blue-200",
        badge: "bg-blue-50 text-blue-700 border-blue-200",
        card: "border-blue-100",
      };
    case "amber":
      return {
        dot: "bg-amber-500",
        iconWrap: "bg-amber-50 text-amber-700 border-amber-200",
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        card: "border-amber-100",
      };
    case "green":
      return {
        dot: "bg-emerald-600",
        iconWrap: "bg-emerald-50 text-emerald-700 border-emerald-200",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        card: "border-emerald-100",
      };
    case "red":
      return {
        dot: "bg-red-600",
        iconWrap: "bg-red-50 text-red-700 border-red-200",
        badge: "bg-red-50 text-red-700 border-red-200",
        card: "border-red-100",
      };
    case "slate":
    default:
      return {
        dot: "bg-slate-500",
        iconWrap: "bg-slate-100 text-slate-700 border-slate-200",
        badge: "bg-slate-100 text-slate-700 border-slate-200",
        card: "border-slate-200",
      };
  }
}

function sortTimelineItems(items: TimelineItem[]) {
  return [...items].sort((a, b) => {
    const dateA = a.sortDate ? new Date(a.sortDate).getTime() : 0;
    const dateB = b.sortDate ? new Date(b.sortDate).getTime() : 0;
    return dateB - dateA;
  });
}

function getDayKey(dateValue?: string | Date | null) {
  const date = dateValue ? new Date(dateValue) : new Date(0);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function getDayLabel(dateValue?: string | Date | null) {
  const date = dateValue ? new Date(dateValue) : new Date(0);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function groupItemsByDay(items: TimelineItem[]): GroupedDay[] {
  const grouped = new Map<string, GroupedDay>();

  for (const item of items) {
    const key = getDayKey(item.sortDate);

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        label: getDayLabel(item.sortDate),
        items: [],
      });
    }

    grouped.get(key)!.items.push(item);
  }

  return [...grouped.values()].sort((a, b) => {
    const aTime = new Date(a.items[0]?.sortDate || 0).getTime();
    const bTime = new Date(b.items[0]?.sortDate || 0).getTime();
    return bTime - aTime;
  });
}

function getIcon(item: TimelineItem) {
  const badge = (item.badge || "").toLowerCase();
  const title = item.title.toLowerCase();

  if (badge.includes("pagamento") || title.includes("pagamento")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path
          d="M4 7h16M4 10h16M6 16h4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (badge.includes("upload") || title.includes("documento")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path
          d="M12 15V5m0 0-3 3m3-3 3 3M5 16.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (badge.includes("entrega") || title.includes("resultado")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path
          d="M7 12.5l3.2 3.2L17 9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (badge.includes("status") || title.includes("pedido")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path
          d="M8 12h8M8 8h8M8 16h5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getRelativeLabel(index: number, total: number) {
  if (index === 0) return "Mais recente";
  if (index === total - 1) return "Primeiro deste dia";
  return null;
}

export default function AdminOrderAuditTimeline({ items }: Props) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
        Nenhum evento encontrado para este pedido ainda.
      </div>
    );
  }

  const sortedItems = sortTimelineItems(items);
  const groupedDays = groupItemsByDay(sortedItems);

  return (
    <div className="space-y-6">
      {groupedDays.map((group) => (
        <section key={group.key} className="space-y-4">
          <div className="sticky top-0 z-10 -mx-1 px-1">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              {group.label}
            </div>
          </div>

          <div className="relative pl-5 sm:pl-6">
            <div className="absolute bottom-0 left-[9px] top-0 w-px bg-slate-200 sm:left-[11px]" />

            <div className="space-y-4">
              {group.items.map((item, index) => {
                const tone = getToneClasses(item.tone);
                const relativeLabel = getRelativeLabel(index, group.items.length);

                return (
                  <div key={item.id} className="relative">
                    <span
                      className={`absolute -left-[1px] top-5 h-5 w-5 rounded-full border-4 border-white ${tone.dot} sm:-left-[1px]`}
                    />

                    <div
                      className={`rounded-3xl border ${tone.card} bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${tone.iconWrap}`}
                            >
                              {getIcon(item)}
                            </span>

                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 sm:text-[15px]">
                                {item.title}
                              </p>

                              {relativeLabel ? (
                                <p className="mt-0.5 text-xs font-medium text-slate-500">
                                  {relativeLabel}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          {item.description ? (
                            <p className="mt-3 pl-11 text-sm leading-6 text-slate-600">
                              {item.description}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 flex-row items-center gap-2 pl-11 sm:flex-col sm:items-end sm:gap-2 sm:pl-0">
                          {item.badge ? (
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tone.badge}`}
                            >
                              {item.badge}
                            </span>
                          ) : null}

                          <span className="text-xs text-slate-500">
                            {item.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}