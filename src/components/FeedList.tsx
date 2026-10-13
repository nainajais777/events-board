"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";
import type { PublicEvent } from "@/lib/events";

type FeedResponse = {
  categories: string[];
  events: PublicEvent[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export default function FeedList() {
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<FeedResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/feed?page=${page}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        return (await res.json()) as FeedResponse;
      })
      .then((json) => {
        setData(json);
        setStatus("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setStatus("error");
      });
    return () => controller.abort();
  }, [page, reloadKey]);

  function goToPage(next: number) {
    setStatus("loading");
    setPage(next);
  }

  if (status === "loading") {
    return (
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-xl bg-gray-200" />)}
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-800">We couldn&apos;t load your feed right now.</p>
        <button onClick={() => { setStatus("loading"); setReloadKey((k) => k + 1); }} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-white">
          Try again
        </button>
      </div>
    );
  }

  if (data.categories.length === 0) {
    return (
      <div className="mt-6 rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-medium text-gray-900">You haven&apos;t picked any favourite categories yet.</p>
        <Link href="/favourites" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white">
          Choose favourites
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mt-2 text-sm text-gray-600">
        Showing: {data.categories.join(", ")} ·{" "}
        <Link href="/favourites" className="text-indigo-700 hover:underline">Change</Link>
      </p>

      {data.events.length === 0 ? (
        <div className="mt-6 rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-gray-900">No upcoming events in your categories right now.</p>
          <p className="mt-1 text-gray-600">Check back soon, or add more categories.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.events.map((event) => <EventCard key={event.id} event={event} />)}
        </ul>
      )}

      {data.pagination.totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-4" aria-label="Pagination">
          <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 disabled:opacity-40">
            Previous
          </button>
          <span className="text-sm text-gray-700">Page {data.pagination.page} of {data.pagination.totalPages}</span>
          <button onClick={() => goToPage(page + 1)} disabled={page >= data.pagination.totalPages} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 disabled:opacity-40">
            Next
          </button>
        </nav>
      )}
    </>
  );
}