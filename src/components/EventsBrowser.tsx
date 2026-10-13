"use client";

import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import EventCard from "@/components/EventCard";
import type { PublicEvent } from "@/lib/events";
import { useReminders } from "@/hooks/useReminders";

type Filters = { category: string; city: string; q: string };

type EventsResponse = {
  events: PublicEvent[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

const EMPTY_FILTERS: Filters = { category: "", city: "", q: "" };

export default function EventsBrowser() {
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);    // what the user is typing
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS); // what was last submitted
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<EventsResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const reminders = useReminders();
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page) });
    if (filters.category) params.set("category", filters.category);
    if (filters.city.trim()) params.set("city", filters.city.trim());
    if (filters.q.trim()) params.set("q", filters.q.trim());

    fetch(`/api/events?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        return (await res.json()) as EventsResponse;
      })
      .then((json) => {
        setData(json);
        setStatus("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setStatus("error");
      });

    return () => controller.abort();
  }, [filters, page, reloadKey]);

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setFilters({ ...draft }); // a new object, so the effect re-runs even if nothing changed
    setPage(1);
  }

  function clearFilters() {
    setDraft(EMPTY_FILTERS);
    setStatus("loading");
    setFilters({ ...EMPTY_FILTERS });
    setPage(1);
  }

  function goToPage(next: number) {
    setStatus("loading");
    setPage(next);
  }

  function retry() {
    setStatus("loading");
    setReloadKey((key) => key + 1);
  }

  const pagination = data?.pagination;

  return (
    <section className="mt-6">
      <form onSubmit={applyFilters} className="grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-4">
        <select
          aria-label="Category"
          value={draft.category}
          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <input
          aria-label="City"
          placeholder="City (e.g. Coimbatore)"
          value={draft.city}
          onChange={(e) => setDraft({ ...draft, city: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        />
        <input
          aria-label="Search"
          placeholder="Search (e.g. night)"
          value={draft.q}
          onChange={(e) => setDraft({ ...draft, q: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        />
        <div className="flex gap-2">
          <button type="submit" className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
            Search
          </button>
          <button type="button" onClick={clearFilters} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50">
            Clear
          </button>
        </div>
      </form>

      {status === "loading" && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      )}

      {status === "error" && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-800">We couldn&apos;t load events right now.</p>
          <button onClick={retry} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">
            Try again
          </button>
        </div>
      )}

      {status === "ready" && data && data.events.length === 0 && (
        <div className="mt-6 rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-gray-900">No events match your filters.</p>
          <p className="mt-1 text-gray-600">Try another city or category, or clear the filters.</p>
          <button onClick={clearFilters} className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">
            Clear filters
          </button>
        </div>
      )}

      {status === "ready" && data && data.events.length > 0 && (
        <>
        {reminders.error && (
  <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{reminders.error}</p>
)}
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.events.map((event) => (
<EventCard
  key={event.id}
  event={event}
  reminder={{
    status: reminders.status,
    isOn: reminders.isOn(event.id),
    pending: reminders.isPending(event.id),
    onToggle: () => reminders.toggle(event.id),
  }}
/>            ))}
          </ul>

          {pagination && pagination.totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-4" aria-label="Pagination">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= pagination.totalPages}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}