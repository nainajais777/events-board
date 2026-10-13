"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CATEGORIES, type Category } from "@/lib/categories";

export default function FavouritesPicker() {
  const [selected, setSelected] = useState<Category[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/me/favourites")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        return (await res.json()) as { categories: Category[] };
      })
      .then((data) => {
        setSelected(data.categories);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [reloadKey]);

  function toggle(category: Category) {
    setMessage(null);
    setSelected((current) =>
      current.includes(category) ? current.filter((c) => c !== category) : [...current, category]
    );
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/me/favourites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: selected }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      setMessage({ ok: true, text: "Saved! My Feed now shows these categories." });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Could not save. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return <div className="mt-6 h-32 animate-pulse rounded-xl bg-gray-200" aria-busy="true" />;
  }

  if (status === "error") {
    return (
      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-800">We couldn&apos;t load your favourites.</p>
        <button onClick={() => { setStatus("loading"); setReloadKey((k) => k + 1); }} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-white">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap gap-3">
        {CATEGORIES.map((category) => {
          const isOn = selected.includes(category);
          return (
            <button
              key={category}
              type="button"
              aria-pressed={isOn}
              onClick={() => toggle(category)}
              className={
                isOn
                  ? "rounded-full border border-indigo-600 bg-indigo-600 px-4 py-2 font-medium text-white"
                  : "rounded-full border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:border-indigo-400"
              }
            >
              {isOn ? "✓ " : ""}{category}
            </button>
          );
        })}
      </div>

      {message && (
        <p role="status" className={message.ok ? "mt-4 text-sm text-green-700" : "mt-4 text-sm text-red-700"}>
          {message.text}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={saving} className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          {saving ? "Saving…" : "Save favourites"}
        </button>
        <Link href="/feed" className="font-medium text-indigo-700 hover:underline">Go to My Feed →</Link>
      </div>
    </div>
  );
}