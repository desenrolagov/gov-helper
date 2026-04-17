export function isBusinessHours() {
  const now = new Date();

  const day = now.getDay(); // 0 = domingo, 6 = sábado
  const hour = now.getHours();

  // Segunda a sexta, 08h às 18h
  const isWeekday = day >= 1 && day <= 5;
  const isWorkingHour = hour >= 8 && hour < 18;

  return isWeekday && isWorkingHour;
}