"use client";

import { useEffect, useState } from "react";
import CardDesigner from "@/components/CardDesigner";
import type { PublicEvent } from "@/lib/events";
import { formatEventDate, formatPrice } from "@/lib/format";

export default function EventDetail({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound" | "error">("loading");

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then(async (res) => {
        if (res.status === 404 || res.status === 400) {
          setStatus("notfound");
          return;
        }
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        const data = (await res.json()) as { event: PublicEvent };
        setEvent(data.event);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [eventId]);

  if (status === "loading") return <div className="h-80 animate-pulse rounded-xl bg-gray-200" aria-busy="true" />;
  if (status === "notfound") return <p className="rounded-xl bg-white p-8 text-center text-gray-700 shadow-sm">This event isn&apos;t available.</p>;
  if (status === "error" || !event) return <p className="rounded-xl bg-red-50 p-8 text-center text-red-800">We couldn&apos;t load this event. Please refresh.</p>;

  return (
    <article>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={event.imageUrl} alt={event.title} className="h-64 w-full rounded-xl bg-gray-200 object-cover" />
      <span className="mt-4 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">{event.category}</span>
      <h1 className="mt-2 text-3xl font-bold text-gray-900">{event.title}</h1>
      <p className="mt-1 text-gray-600">{formatEventDate(event.startsAt)} · {event.city} · {formatPrice(event.pricePaise)}</p>
      <p className="mt-4 text-gray-800">{event.description}</p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">Design your card</h2>
        <CardDesigner event={event} />
      </section>
    </article>
  );
}