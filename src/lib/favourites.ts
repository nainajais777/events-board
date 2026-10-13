import { pool } from "@/lib/db";
import type { Category } from "@/lib/categories";

export async function getFavourites(userId: number): Promise<Category[]> {
  const result = await pool.query<{ category: Category }>(
    "SELECT category FROM user_favourite_categories WHERE user_id = $1 ORDER BY category",
    [userId]
  );
  return result.rows.map((row) => row.category);
}

// Replaces the whole set atomically: either all new rows are saved, or nothing changes.
export async function setFavourites(userId: number, categories: Category[]): Promise<Category[]> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM user_favourite_categories WHERE user_id = $1", [userId]);
    if (categories.length > 0) {
      await client.query(
        "INSERT INTO user_favourite_categories (user_id, category) SELECT $1, unnest($2::text[])",
        [userId, categories]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return getFavourites(userId);
}