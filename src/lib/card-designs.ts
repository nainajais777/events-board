import { pool } from "@/lib/db";
import type { CardDesign } from "@/lib/card-options";

export async function getCardDesign(userId: number, eventId: number): Promise<CardDesign | null> {
  const result = await pool.query<CardDesign>(
    "SELECT theme, stickers FROM card_designs WHERE user_id = $1 AND event_id = $2",
    [userId, eventId]
  );
  return result.rows[0] ?? null;
}

export async function saveCardDesign(userId: number, eventId: number, design: CardDesign): Promise<CardDesign> {
  const result = await pool.query<CardDesign>(
    `INSERT INTO card_designs (user_id, event_id, theme, stickers)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, event_id)
     DO UPDATE SET theme = EXCLUDED.theme, stickers = EXCLUDED.stickers, updated_at = now()
     RETURNING theme, stickers`,
    [userId, eventId, design.theme, design.stickers]
  );
  return result.rows[0];
}