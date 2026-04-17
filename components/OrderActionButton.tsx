"use client";

import Link from "next/link";
import {
  getOrderFlow,
  getOrderToneClasses,
  isValidOrderStatus,
  type OrderStatus,
} from "@/lib/order-flow";

type LegacyProps = {
  order: {
    id: string;
    status: string;
    filesCount?: number;
    resultFilesCount?: number;
  };
};

type ModernProps = {
  status: OrderStatus | string;
  orderId: string;
  filesCount?: number;
  resultFilesCount?: number;
  className?: string;
};

type Props = LegacyProps | ModernProps;

function isLegacyProps(props: Props): props is LegacyProps {
  return "order" in props;
}

export default function OrderActionButton(props: Props) {
  const orderId = isLegacyProps(props) ? props.order.id : props.orderId;
  const rawStatus = isLegacyProps(props) ? props.order.status : props.status;
  const filesCount = isLegacyProps(props)
    ? props.order.filesCount ?? 0
    : props.filesCount ?? 0;
  const resultFilesCount = isLegacyProps(props)
    ? props.order.resultFilesCount ?? 0
    : props.resultFilesCount ?? 0;
  const className = isLegacyProps(props) ? "" : props.className ?? "";

  if (!isValidOrderStatus(rawStatus)) {
    return null;
  }

  const flow = getOrderFlow(rawStatus, {
    orderId,
    filesCount,
    resultFilesCount,
  });

  const toneClasses = getOrderToneClasses(flow.tone);

  return (
    <Link
      href={flow.primaryAction.href}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${toneClasses.button} ${className}`}
    >
      {flow.primaryAction.label}
    </Link>
  );
}