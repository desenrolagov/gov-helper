type TimelineItem = {
  id: string;
  title: string;
  description?: string | null;
  timestamp: string;
  tone?: "slate" | "blue" | "amber" | "green" | "red";
  badge?: string | null;
};

type Props = {
  items: TimelineItem[];
};

function getToneClasses(tone: TimelineItem["tone"] = "slate") {
  switch (tone) {
    case "blue":
      return {
        dot: "bg-blue-600",
        badge: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "amber":
      return {
        dot: "bg-amber-500",
        badge: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "green":
      return {
        dot: "bg-emerald-600",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "red":
      return {
        dot: "bg-red-600",
        badge: "bg-red-50 text-red-700 border-red-200",
      };
    case "slate":
    default:
      return {
        dot: "bg-slate-500",
        badge: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
}

export default function AdminOrderAuditTimeline({ items }: Props) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
        Nenhum evento encontrado para este pedido ainda.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const tone = getToneClasses(item.tone);

        return (
          <div key={item.id} className="relative pl-8">
            {index < items.length - 1 ? (
              <div className="absolute left-[11px] top-6 h-[calc(100%+12px)] w-px bg-slate-200" />
            ) : null}

            <div
              className={`absolute left-0 top-1.5 h-[22px] w-[22px] rounded-full border-4 border-white shadow ${tone.dot}`}
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>

                  {item.description ? (
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  {item.badge ? (
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone.badge}`}
                    >
                      {item.badge}
                    </span>
                  ) : null}

                  <span className="text-xs text-slate-500">{item.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}