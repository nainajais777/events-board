"use client";

import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import type { AdminEvent } from "@/lib/events";
import { formatEventDate, formatPrice } from "@/lib/format";

const EMPTY_FORM = {
  title: "",
  category: "Music",
  city: "",
  startsAt: "",
  price: "",
  description: "",
  imageUrl: "",
};
type FormState = typeof EMPTY_FORM;

const inputClass = "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900";

export default function AdminDashboard() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/events")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        return (await res.json()) as { events: AdminEvent[] };
      })
      .then((data) => {
        setEvents(data.events);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [reloadKey]);

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormErrors([]);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          city: form.city,
          startsAt: `${form.startsAt}:00+05:30`, // the admin types India time
          pricePaise: Math.round(Number(form.price) * 100),
          description: form.description,
          imageUrl: form.imageUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const details: { field: string; message: string }[] | undefined = data.details;
        setFormErrors(details ? details.map((d) => `${d.field}: ${d.message}`) : [data.error ?? "Could not create event"]);
        return;
      }

      setForm(EMPTY_FORM);
      setMessage(`Created "${data.event.title}".`);
      setReloadKey((key) => key + 1);
    } catch {
      setFormErrors(["Network error. Please try again."]);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(target: AdminEvent) {
    setTogglingId(target.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/events/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !target.isActive }),
      });
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      const data = (await res.json()) as { event: AdminEvent };
      setEvents((list) => list.map((e) => (e.id === data.event.id ? data.event : e)));
    } catch {
      setMessage("Could not update the event. Please try again.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[380px_1fr]">
      <form onSubmit={handleCreate} className="space-y-3 self-start rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Add an event</h2>

        <label className="block text-sm font-medium text-gray-700">Title
          <input required maxLength={120} value={form.title} onChange={(e) => update("title", e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-gray-700">Category
          <select value={form.category} onChange={(e) => update("category", e.target.value)} className={inputClass}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-gray-700">City
          <input required maxLength={60} value={form.city} onChange={(e) => update("city", e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-gray-700">Date and time (India time)
          <input required type="datetime-local" value={form.startsAt} onChange={(e) => update("startsAt", e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-gray-700">Price in ₹ (0 for free)
          <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-gray-700">Image URL
          <input required type="url" placeholder="https://..." value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-gray-700">Description
          <textarea required rows={3} maxLength={2000} value={form.description} onChange={(e) => update("description", e.target.value)} className={inputClass} />
        </label>

        {formErrors.length > 0 && (
          <ul role="alert" className="list-inside list-disc rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {formErrors.map((err) => <li key={err}>{err}</li>)}
          </ul>
        )}

        <button type="submit" disabled={saving} className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          {saving ? "Saving…" : "Create event"}
        </button>
      </form>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">All events</h2>
        {message && <p className="mt-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">{message}</p>}

        {status === "loading" && <div className="mt-4 h-40 animate-pulse rounded-xl bg-gray-200" aria-busy="true" />}

        {status === "error" && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-red-800">Could not load events.</p>
            <button onClick={() => { setStatus("loading"); setReloadKey((k) => k + 1); }} className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-white">
              Try again
            </button>
          </div>
        )}

        {status === "ready" && events.length === 0 && (
          <p className="mt-4 rounded-xl bg-white p-6 text-center text-gray-600 shadow-sm">No events yet. Add the first one.</p>
        )}

        {status === "ready" && events.length > 0 && (
          <ul className="mt-4 divide-y divide-gray-100 rounded-xl bg-white shadow-sm">
            {events.map((event) => {
              const isPast = new Date(event.startsAt) < new Date();
              return (
                <li key={event.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600">
                      {event.category} · {event.city} · {formatEventDate(event.startsAt)} · {formatPrice(event.pricePaise)}
                    </p>
                    <div className="mt-1 flex gap-2 text-xs">
                      <span className={event.isActive ? "rounded-full bg-green-50 px-2 py-0.5 text-green-700" : "rounded-full bg-gray-100 px-2 py-0.5 text-gray-600"}>
                        {event.isActive ? "Active" : "Inactive"}
                      </span>
                      {isPast && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">Past</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive(event)}
                    disabled={togglingId === event.id}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {togglingId === event.id ? "Saving…" : event.isActive ? "Make inactive" : "Make active"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}