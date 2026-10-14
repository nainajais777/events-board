# Community Events Board

An event discovery app: an admin posts local events, and visitors browse and filter them, pick favourite categories, set reminders and design a personal card for an event.

Built for the FyerX full-stack assignment.

## Tech stack

- **Next.js 16.4** (App Router, TypeScript) and **React 19**: pages and the JSON API (Route Handlers) in one app
- **PostgreSQL 17** in Docker, queried with `pg` (node-postgres) using parameterized SQL
- **Zod** for validation, **bcryptjs** for password hashing, **jose** for JWTs
- **Tailwind CSS 4** for styling

## Getting started

**Prerequisites:** Node.js 20.9+ and Docker Desktop (running).

```bash
git clone https://github.com/nainajais777/events-board.git
cd events-board
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
docker compose up -d        # PostgreSQL on localhost:5433
npm run db:reset            # schema, 15 sample events and the admin account
npm run dev                 # http://localhost:3000
```

**Notes**
- PostgreSQL uses port `5433` to avoid clashing with a local PostgreSQL on `5432`.
- `npm run db:reset` **deletes all data** and recreates it. Sample dates are relative to the day you run it (India time), so there are always upcoming events.
- After a reset, log in again: existing tokens may refer to users that no longer exist.

## Demo admin

| Email | Password |
|---|---|
| `admin@events.test` | `Admin@12345` |

Set via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` (local demo only).

## Pages

| Route | Access | What it does |
|---|---|---|
| `/events` | Public | Active, upcoming events, nearest first; category + city + text filters; pagination |
| `/events/[id]` | Public (card design needs login) | Event details and "Design your card" |
| `/signup`, `/login` | Public | Email and password |
| `/favourites` | Logged-in users | Choose favourite categories |
| `/feed` | Logged-in users | Upcoming events from favourite categories |
| `/admin` | Admin | Create events, activate or deactivate them |

## API

All `/api` endpoints return JSON; the web pages are rendered as HTML.

**Authentication:** the web app uses the httpOnly cookie set at login. API clients (for example a future mobile app) send the token from the login response as `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/events?category=&city=&q=&page=&pageSize=` | Public | Filtered, paginated upcoming events |
| GET | `/api/events/:id` | Public | One active event |
| POST | `/api/auth/signup` | Public | Register `{ email, password }` |
| POST | `/api/auth/login` | Public | Returns `{ token, user }` and sets the cookie |
| POST | `/api/auth/logout` | Public | Clears the cookie |
| GET | `/api/auth/me` | User | Current user |
| GET / PUT | `/api/me/favourites` | User | Read or replace favourite categories |
| GET | `/api/feed?page=` | User | Upcoming events from favourite categories |
| GET | `/api/me/reminders` | User | Event ids with reminders |
| PUT / DELETE | `/api/events/:id/reminder` | User | Set or remove a reminder (idempotent) |
| GET / PUT | `/api/events/:id/card-design` | User | Read or save `{ theme, stickers }` |
| GET / POST | `/api/admin/events` | Admin | List all events or create one |
| PATCH | `/api/admin/events/:id` | Admin | `{ isActive }`: events are never deleted |
| GET | `/api/health` | Public | Database connectivity check |

Errors are returned as `{ "error": "...", "details"?: [...] }` with status `400`, `401`, `403`, `404`, `409` or `500`.

## Three answers

### 1. Show your database structure. Why did you design it this way?

| Table | Key columns |
|---|---|
| `users` | `id`, `email` (unique, lowercase), `password_hash`, `role` (`user` / `admin`) |
| `events` | `id`, `title`, `category` → `categories`, `city`, `starts_at` (timestamptz), `price_paise`, `description`, `image_url`, `is_active` |
| `categories` | `name` (primary key) |
| `user_favourite_categories` | primary key (`user_id`, `category`) |
| `reminders` | primary key (`user_id`, `event_id`) |
| `card_designs` | primary key (`user_id`, `event_id`), `theme`, `stickers` (max 3) |

The admin is a user with role `admin`, so there is one login system. Prices are integer paise to avoid floating-point errors, and `timestamptz` makes "upcoming" an exact comparison with `now()`. Composite primary keys let the database itself block duplicates (such as a double-clicked reminder), and constraints enforce valid categories, themes, unique emails and the 3-sticker limit.

### 2. How does your filter query work, and what index would you add?

The query always applies `is_active AND starts_at > now()`; each optional filter adds an `AND` condition with a numbered placeholder, and values are passed separately, so there is no SQL injection. Results are sorted by `starts_at, id` (stable across pages), paged with `LIMIT/OFFSET`, and `count(*) OVER ()` returns the total in the same query. I added a partial index on `events (starts_at, id) WHERE is_active`, matching the base condition and sort order; `EXPLAIN` shows it used for the upcoming filter. For larger data I would add a `pg_trgm` index for text search.

### 3. How do you store passwords and protect the admin pages and APIs?

Passwords are hashed with bcrypt (cost 12) and never stored or returned in plain text. Login issues an HS256 JWT (24-hour expiry, user id and role) in an httpOnly, SameSite=Lax cookie. Admin pages are protected on the server by `src/proxy.ts`, which verifies the token and redirects strangers to `/login` and non-admins to `/events`; every admin API also calls `requireAdmin` and returns 401 or 403. A forged token with its role edited to `admin` is rejected because the signature no longer matches.

## Testing

Tested manually with `curl` and in the browser:

- Admin access as a logged-out user, a normal user, the admin, and with a forged admin token
- Validation: invalid categories, past dates, negative prices, invalid card themes, more than 3 or duplicate stickers
- Combined filters (Music + Coimbatore + "night"), pagination, and `%` searched literally
- Favourites, reminders and card designs persist after refresh
- Remind me rollback: with DevTools set to Offline, the button reverts and an error message appears
- `npm run lint` and `npm run build` pass

There is no automated test suite yet.

## Known limitations

- No automated tests; next step would be API tests with Jest and Supertest.
- Filters are not kept in the URL, so a refresh resets them and filtered views can't be shared.
- The login response also returns the JWT for API clients, so page scripts could read it from that response even though the cookie itself is httpOnly. Production would need a stricter token strategy and a Content Security Policy.
- JWTs can't be revoked before they expire, and the role claim can become stale. Improvements: short-lived access tokens with refresh tokens, or checking the role in the database.
- No rate limiting on signup or login; signup reveals whether an email is already registered (409).
- Offset pagination and substring search would need keyset pagination and a trigram index at scale.
- Admins can create and activate or deactivate events, but not edit them.
- Event times are entered and displayed in India Standard Time (IST).

## AI assistance

I used Claude extensively during development. It generated substantial portions of the implementation and helped with debugging and understanding technical decisions. I integrated and reviewed changes, ran the application locally, and tested features using `curl` and the browser.

My existing experience with Node.js, PostgreSQL, SQL and API development helped me understand the backend and database decisions. I am continuing to strengthen my understanding of Next.js and React-specific concepts.

## Walkthrough

[Screen Recording](https://drive.google.com/file/d/1LtXLodrT4Zi-M0l1HKV--APzDpGCPQA5/view?usp=drive_link)