import { formatEventDate, formatPrice } from "@/lib/format";
import type { PublicEvent } from "@/lib/events";

export default function EventCard({ event }: { event: PublicEvent }) {
  return (
    <li className="overflow-hidden rounded-xl bg-white shadow-sm">
      {/* Admin can enter any image URL, so next/image's domain allow-list doesn't fit here */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={event.imageUrl} alt={event.title} className="h-40 w-full bg-gray-200 object-cover" />
      <div className="p-4">
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
          {event.category}
        </span>
        <h2 className="mt-2 text-lg font-semibold text-gray-900">{event.title}</h2>
        <p className="mt-1 text-sm text-gray-600">{formatEventDate(event.startsAt)} · {event.city}</p>
        <p className="mt-2 font-semibold text-gray-900">{formatPrice(event.pricePaise)}</p>
      </div>
    </li>
  );
}