BEGIN;

-- DEV RESET: drops everything. Never run against real data.
DROP TABLE IF EXISTS card_designs, reminders, user_favourite_categories,
  events, users, categories CASCADE;

CREATE TABLE categories (
  name text PRIMARY KEY
);

INSERT INTO categories (name)
VALUES ('Music'), ('Workshop'), ('Food'), ('Sports'), ('Kids');

CREATE TABLE users (
  id            integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         text NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE events (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       text NOT NULL CHECK (length(trim(title)) > 0),
  category    text NOT NULL REFERENCES categories(name),
  city        text NOT NULL CHECK (length(trim(city)) > 0),
  starts_at   timestamptz NOT NULL,
  price_paise integer NOT NULL CHECK (price_paise >= 0),
  description text NOT NULL,
  image_url   text NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_favourite_categories (
  user_id  integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category text    NOT NULL REFERENCES categories(name),
  PRIMARY KEY (user_id, category)
);

CREATE TABLE reminders (
  user_id    integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id   integer NOT NULL REFERENCES events(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

CREATE TABLE card_designs (
  user_id    integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id   integer NOT NULL REFERENCES events(id),
  theme      text NOT NULL CHECK (theme IN ('sunrise', 'ocean', 'night')),
  stickers   text[] NOT NULL DEFAULT '{}' CHECK (cardinality(stickers) <= 3),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

COMMIT;