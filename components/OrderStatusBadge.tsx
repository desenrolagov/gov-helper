import {
  getOrderStatusMeta,
  getOrderToneClasses,
  isValidOrderStatus,
  type OrderStatus,
} from "@/lib/order-flow";

type Props = {
  status: OrderStatus | string;
  className?: string;
};

export default function OrderStatusBadge({
  status,
  className = "",
}: Props) {
  if (!isValidOrderStatus(status)) {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 ${className}`}
      >
        Status não identificado
      </span>
    );
  }

  const meta = getOrderStatusMeta(status);
  const tone = getOrderToneClasses(meta.tone);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${tone.badge} ${className}`}
    >
      {meta.label}
    </span>
  );
}