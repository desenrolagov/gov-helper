"use client";

type SimpleToastProps = {
  message: string;
  type?: "success" | "error" | "info";
};

export default function SimpleToast({
  message,
  type = "info",
}: SimpleToastProps) {
  if (!message) return null;

  function getClasses() {
    switch (type) {
      case "success":
        return "border-green-200 bg-green-50 text-green-700";
      case "error":
        return "border-red-200 bg-red-50 text-red-700";
      default:
        return "border-blue-200 bg-blue-50 text-blue-700";
    }
  }

  return (
    <div className={`border rounded-lg p-3 text-sm ${getClasses()}`}>
      {message}
    </div>
  );
}