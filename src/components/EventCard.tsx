"use client";

import Link from "next/link";
import { formatEventDate, formatPrice } from "@/lib/format";
import type { PublicEvent } from "@/lib/events";

type ReminderProps = {
  status: "loading" | "in" | "out" | "error";
  isOn: boolean;
  pending: boolean;
  onToggle: () => void;
};

export default function EventCard({ event, reminder }: { event: PublicEvent; reminder?: ReminderProps }) {
  return (
    <li className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm">
      {/* Admin can enter any image URL, so next/image's domain allow-list doesn't fit here */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={event.imageUrl} alt={event.title} className="h-40 w-full bg-gray-200 object-cover" />
      <div className="flex flex-1 flex-col p-4">
        <span className="self-start rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
          {event.category}
        </span>
        <h2 className="mt-2 text-lg font-semibold text-gray-900">{event.title}</h2>
        <p className="mt-1 text-sm text-gray-600">{formatEventDate(event.startsAt)} · {event.city}</p>
        <p className="mt-2 font-semibold text-gray-900">{formatPrice(event.pricePaise)}</p>

        {reminder && reminder.status === "out" && (
          <Link href="/login" className="mt-4 text-sm font-medium text-indigo-700 hover:underline">
            Log in to set reminders
          </Link>
        )}
        {reminder && (reminder.status === "in" || reminder.status === "loading") && (
          <button
            type="button"
            onClick={reminder.onToggle}
            disabled={reminder.status === "loading" || reminder.pending}
            aria-pressed={reminder.isOn}
            className={
              reminder.isOn
                ? "mt-4 rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800 transition-colors disabled:opacity-60"
                : "mt-4 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            }
          >
            {reminder.isOn ? "🔔 Reminder set" : "Remind me"}
          </button>
        )}
      </div>
    </li>
  );
}