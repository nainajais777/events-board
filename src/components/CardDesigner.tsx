"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CARD_THEMES, DEFAULT_DESIGN, MAX_STICKERS, STICKER_EMOJI, STICKER_IDS,
  type CardDesign, type CardTheme, type StickerId,
} from "@/lib/card-options";
import type { PublicEvent } from "@/lib/events";
import { formatEventDate } from "@/lib/format";

const THEME_STYLES: Record<CardTheme, { label: string; gradient: string }> = {
  sunrise: { label: "Sunrise", gradient: "linear-gradient(135deg, #fdba74, #f472b6, #e11d48)" },
  ocean: { label: "Ocean", gradient: "linear-gradient(135deg, #67e8f9, #0ea5e9, #4338ca)" },
  night: { label: "Night", gradient: "linear-gradient(135deg, #1e293b, #312e81, #581c87)" },
};

export default function CardDesigner({ event }: { event: PublicEvent }) {
  const [status, setStatus] = useState<"loading" | "ready" | "out" | "error">("loading");
  const [theme, setTheme] = useState<CardTheme>(DEFAULT_DESIGN.theme);
  const [stickers, setStickers] = useState<StickerId[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/events/${event.id}/card-design`)
      .then(async (res) => {
        if (res.status === 401) {
          setStatus("out");
          return;
        }
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        const data = (await res.json()) as { design: CardDesign | null };
        const design = data.design ?? DEFAULT_DESIGN;
        setTheme(design.theme);
        setStickers(design.stickers);
        setSavedSnapshot(JSON.stringify(design));
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [event.id]);

  const isDirty = JSON.stringify({ theme, stickers }) !== savedSnapshot;

  function toggleSticker(id: StickerId) {
    setMessage(null);
    if (stickers.includes(id)) {
      setStickers(stickers.filter((s) => s !== id));
      return;
    }
    if (stickers.length >= MAX_STICKERS) {
      setMessage({ ok: false, text: `You can add up to ${MAX_STICKERS} stickers. Tap one on the card to remove it.` });
      return;
    }
    setStickers([...stickers, id]);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/events/${event.id}/card-design`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, stickers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save your card");
      setSavedSnapshot(JSON.stringify(data.design));
      setMessage({ ok: true, text: "Your card is saved." });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Could not save your card" });
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return <div className="mt-4 h-64 animate-pulse rounded-2xl bg-gray-200" aria-busy="true" />;
  }
  if (status === "out") {
    return (
      <p className="mt-4 rounded-xl bg-white p-6 text-center text-gray-700 shadow-sm">
        <Link href="/login" className="font-medium text-indigo-700 hover:underline">Log in</Link> to design and save your own card for this event.
      </p>
    );
  }
  if (status === "error") {
    return <p className="mt-4 rounded-xl bg-red-50 p-6 text-center text-red-800">We couldn&apos;t load the card designer. Please refresh the page.</p>;
  }

  return (
    <div className="mt-4 grid gap-6 md:grid-cols-2">
      {/* Live preview */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md">
        {CARD_THEMES.map((t) => (
          <div
            key={t}
            className={`absolute inset-0 transition-opacity duration-500 ${theme === t ? "opacity-100" : "opacity-0"}`}
            style={{ backgroundImage: THEME_STYLES[t].gradient }}
          />
        ))}
        <div className="relative flex h-full flex-col justify-between p-5 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-90">{event.category}</p>
            <p className="mt-1 text-2xl font-bold drop-shadow">{event.title}</p>
            <p className="mt-1 text-sm opacity-95">{formatEventDate(event.startsAt)} · {event.city}</p>
          </div>
          <div className="flex gap-3">
            {stickers.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleSticker(id)}
                aria-label={`Remove ${id} sticker`}
                className="animate-sticker-pop text-4xl transition-transform hover:scale-110"
              >
                {STICKER_EMOJI[id]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-5 rounded-2xl bg-white p-5 shadow-sm">
        <div>
          <p className="text-sm font-medium text-gray-700">Background</p>
          <div className="mt-2 flex gap-3">
            {CARD_THEMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTheme(t); setMessage(null); }}
                aria-pressed={theme === t}
                className={`h-12 w-20 rounded-lg text-xs font-semibold text-white shadow ${theme === t ? "ring-2 ring-indigo-600 ring-offset-2" : ""}`}
                style={{ backgroundImage: THEME_STYLES[t].gradient }}
              >
                {THEME_STYLES[t].label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">
            Stickers <span className="text-gray-500">({stickers.length}/{MAX_STICKERS})</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {STICKER_IDS.map((id) => {
              const isOn = stickers.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleSticker(id)}
                  aria-pressed={isOn}
                  aria-label={`${isOn ? "Remove" : "Add"} ${id} sticker`}
                  className={`h-12 w-12 rounded-lg border text-2xl transition ${isOn ? "border-indigo-600 bg-indigo-50" : "border-gray-300 hover:bg-gray-50"}`}
                >
                  {STICKER_EMOJI[id]}
                </button>
              );
            })}
          </div>
        </div>

        {message && (
          <p role="status" className={message.ok ? "text-sm text-green-700" : "text-sm text-red-700"}>{message.text}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving || !isDirty}
            className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save card"}
          </button>
          <span className="text-sm text-gray-500">{isDirty ? "Unsaved changes" : "All changes saved"}</span>
        </div>
      </div>
    </div>
  );
}