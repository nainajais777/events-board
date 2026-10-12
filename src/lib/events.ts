import { pool } from "@/lib/db";
import type { Category } from "@/lib/categories";

export type EventFilters = {
  category?: Category;
  city?: string;
  q?: string;
  page: number;
  pageSize: number;
};

export type PublicEvent = {
  id: number;
  title: string;
  category: Category;
  city: string;
  startsAt: string;
  pricePaise: number;
  description: string;
  imageUrl: string;
};

type EventRow = {
  id: number;
  title: string;
  category: Category;
  city: string;
  starts_at: Date;
  price_paise: number;
  description: string;
  image_url: string;
  total_count: number;
};

// % and _ are wildcards in ILIKE; escape them so they match literally.
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, "\\$&");
}

export async function listUpcomingEvents(filters: EventFilters) {
  const conditions = ["is_active = true", "starts_at > now()"];
  const values: unknown[] = [];

  if (filters.category) {
    values.push(filters.category);
    conditions.push(`category = $${values.length}`);
  }
  if (filters.city) {
    values.push(filters.city);
    conditions.push(`lower(city) = lower($${values.length})`);
  }
  if (filters.q) {
    values.push(`%${escapeLike(filters.q)}%`);
    const p = `$${values.length}`;
    conditions.push(`(title ILIKE ${p} OR description ILIKE ${p})`);
  }

  const where = conditions.join(" AND ");
  const filterValues = [...values];

  values.push(filters.pageSize, (filters.page - 1) * filters.pageSize);
  const limitParam = `$${values.length - 1}`;
  const offsetParam = `$${values.length}`;

  const result = await pool.query<EventRow>(
    `SELECT id, title, category, city, starts_at, price_paise, description, image_url,
            count(*) OVER ()::int AS total_count
       FROM events
      WHERE ${where}
      ORDER BY starts_at ASC, id ASC
      LIMIT ${limitParam} OFFSET ${offsetParam}`,
    values
  );

  let total = result.rows[0]?.total_count ?? 0;

  // A page past the end returns no rows, so the window count is missing. Count separately.
  if (result.rows.length === 0 && filters.page > 1) {
    const countResult = await pool.query<{ total: number }>(
      `SELECT count(*)::int AS total FROM events WHERE ${where}`,
      filterValues
    );
    total = countResult.rows[0].total;
  }

  const events: PublicEvent[] = result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    city: row.city,
    startsAt: row.starts_at.toISOString(),
    pricePaise: row.price_paise,
    description: row.description,
    imageUrl: row.image_url,
  }));

  return {
    events,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.ceil(total / filters.pageSize),
    },
  };
}