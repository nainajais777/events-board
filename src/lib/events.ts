import { pool } from "@/lib/db";
import type { Category } from "@/lib/categories";

export type EventFilters = {
  category?: Category;
  categories?: Category[];
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
    if (filters.categories) {
    values.push(filters.categories);
    conditions.push(`category = ANY($${values.length}::text[])`);
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
export type AdminEvent = PublicEvent & { isActive: boolean };

type AdminEventRow = Omit<EventRow, "total_count"> & { is_active: boolean };

const ADMIN_COLUMNS =
  "id, title, category, city, starts_at, price_paise, description, image_url, is_active";

function toAdminEvent(row: AdminEventRow): AdminEvent {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    city: row.city,
    startsAt: row.starts_at.toISOString(),
    pricePaise: row.price_paise,
    description: row.description,
    imageUrl: row.image_url,
    isActive: row.is_active,
  };
}

export async function listAllEvents(): Promise<AdminEvent[]> {
  const result = await pool.query<AdminEventRow>(
    `SELECT ${ADMIN_COLUMNS} FROM events ORDER BY starts_at DESC, id DESC LIMIT 200`
  );
  return result.rows.map(toAdminEvent);
}

export type NewEvent = {
  title: string;
  category: Category;
  city: string;
  startsAt: string;
  pricePaise: number;
  description: string;
  imageUrl: string;
};

export async function createEvent(input: NewEvent): Promise<AdminEvent> {
  const result = await pool.query<AdminEventRow>(
    `INSERT INTO events (title, category, city, starts_at, price_paise, description, image_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${ADMIN_COLUMNS}`,
    [input.title, input.category, input.city, input.startsAt, input.pricePaise, input.description, input.imageUrl]
  );
  return toAdminEvent(result.rows[0]);
}

export async function setEventActive(id: number, isActive: boolean): Promise<AdminEvent | null> {
  const result = await pool.query<AdminEventRow>(
    `UPDATE events SET is_active = $2 WHERE id = $1 RETURNING ${ADMIN_COLUMNS}`,
    [id, isActive]
  );
  return result.rows[0] ? toAdminEvent(result.rows[0]) : null;
}
export async function getPublicEvent(id: number): Promise<PublicEvent | null> {
  const result = await pool.query<AdminEventRow>(
    `SELECT ${ADMIN_COLUMNS} FROM events WHERE id = $1 AND is_active`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
   const { isActive, ...event } = toAdminEvent(row);
  return isActive ? event : null;
}