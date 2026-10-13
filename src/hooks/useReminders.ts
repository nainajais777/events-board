"use client";

import { useEffect, useState } from "react";

type Status = "loading" | "in" | "out" | "error";

function withChange(set: Set<number>, id: number, include: boolean): Set<number> {
  const next = new Set(set);
  if (include) next.add(id);
  else next.delete(id);
  return next;
}

export function useReminders() {
  const [status, setStatus] = useState<Status>("loading");
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me/reminders")
      .then(async (res) => {
        if (res.status === 401) {
          setStatus("out");
          return;
        }
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        const data = (await res.json()) as { eventIds: number[] };
        setIds(new Set(data.eventIds));
        setStatus("in");
      })
      .catch(() => setStatus("error"));
  }, []);

  async function toggle(eventId: number) {
    if (pending.has(eventId)) return;
    const wasOn = ids.has(eventId);

    setError(null);
    setIds((current) => withChange(current, eventId, !wasOn)); // 1. optimistic: update the screen now
    setPending((current) => withChange(current, eventId, true));

    try {
      const res = await fetch(`/api/events/${eventId}/reminder`, { method: wasOn ? "DELETE" : "PUT" });
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
    } catch {
      setIds((current) => withChange(current, eventId, wasOn)); // 2. rollback: put it back as it was
      setError("Couldn't update your reminder. Please try again.");
    } finally {
      setPending((current) => withChange(current, eventId, false));
    }
  }

  return {
    status,
    error,
    isOn: (eventId: number) => ids.has(eventId),
    isPending: (eventId: number) => pending.has(eventId),
    toggle,
  };
}