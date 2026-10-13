import { pool } from "@/lib/db";

export async function listReminderEventIds(userId: number): Promise<number[]> {
  const result = await pool.query<{ event_id: number }>(
    "SELECT event_id FROM reminders WHERE user_id = $1",
    [userId]
  );
  return result.rows.map((row) => row.event_id);
}

// Returns false if the event doesn't exist or isn't active and upcoming.
export async function addReminder(userId: number, eventId: number): Promise<boolean> {
  const inserted = await pool.query(
    `INSERT INTO reminders (user_id, event_id)
     SELECT $1, id FROM events WHERE id = $2 AND is_active AND starts_at > now()
     ON CONFLICT (user_id, event_id) DO NOTHING`,
    [userId, eventId]
  );
  if (inserted.rowCount === 1) return true;

  // Nothing inserted: either it already existed (fine, idempotent) or the event isn't available.
  const existing = await pool.query(
    "SELECT 1 FROM reminders WHERE user_id = $1 AND event_id = $2",
    [userId, eventId]
  );
  return existing.rowCount === 1;
}

export async function removeReminder(userId: number, eventId: number): Promise<void> {
  await pool.query("DELETE FROM reminders WHERE user_id = $1 AND event_id = $2", [userId, eventId]);
}