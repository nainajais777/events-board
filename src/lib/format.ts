const rupeesWhole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const rupeesWithPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

export function formatPrice(paise: number): string {
  if (paise === 0) return "Free";
  const rupees = paise / 100;
  return Number.isInteger(rupees) ? rupeesWhole.format(rupees) : rupeesWithPaise.format(rupees);
}

const dateParts = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

// Produces "Sat, 18 Oct, 6:30 PM"
export function formatEventDate(iso: string): string {
  const parts = Object.fromEntries(
    dateParts.formatToParts(new Date(iso)).map((part) => [part.type, part.value])
  );
  return `${parts.weekday}, ${parts.day} ${parts.month}, ${parts.hour}:${parts.minute} ${parts.dayPeriod.toUpperCase()}`;
}