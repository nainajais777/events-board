BEGIN;

-- Helper: "N days from today, at this local India time" → absolute timestamptz.
-- pg_temp means it exists only for this session and disappears afterwards.
CREATE FUNCTION pg_temp.ist(days int, local_time time) RETURNS timestamptz AS $$
  SELECT (((now() AT TIME ZONE 'Asia/Kolkata')::date + days) + local_time)
         AT TIME ZONE 'Asia/Kolkata'
$$ LANGUAGE sql;

INSERT INTO events (title, category, city, starts_at, price_paise, description, image_url, is_active) VALUES
-- Active, upcoming (11)
('Jazz Night by the Lake',              'Music',    'Coimbatore', pg_temp.ist(2,  '19:30'),    49900, 'Live jazz trio with lakeside seating.',                 'https://picsum.photos/seed/jazz-night/800/450',      true),
('Carnatic Morning Concert',            'Music',    'Coimbatore', pg_temp.ist(9,  '07:00'),        0, 'A free morning concert by local musicians.',           'https://picsum.photos/seed/carnatic/800/450',        true),
('Night Food Market',                   'Food',     'Coimbatore', pg_temp.ist(4,  '20:00'),        0, 'Street food stalls open till midnight.',               'https://picsum.photos/seed/food-market/800/450',     true),
('Indie Rock Night',                    'Music',    'Bengaluru',  pg_temp.ist(6,  '20:30'),    79900, 'Three indie bands, one stage.',                        'https://picsum.photos/seed/indie-rock/800/450',      true),
('Pottery for Beginners',               'Workshop', 'Bengaluru',  pg_temp.ist(3,  '11:00'),   120000, 'Hands-on wheel pottery. All materials included.',      'https://picsum.photos/seed/pottery/800/450',         true),
('Weekend Watercolour Workshop',        'Workshop', 'Pune',       pg_temp.ist(12, '10:00'),    99900, 'Learn landscapes in watercolour.',                     'https://picsum.photos/seed/watercolour/800/450',     true),
('South Indian Street Food Fair',       'Food',     'Chennai',    pg_temp.ist(5,  '17:00'),        0, 'Dosas, chaats and filter coffee.',                     'https://picsum.photos/seed/street-food/800/450',     true),
('City Marathon 10K',                   'Sports',   'Mumbai',     pg_temp.ist(15, '05:30'),    75000, 'Timed 10K run along the sea face.',                    'https://picsum.photos/seed/marathon/800/450',        true),
('Corporate Cricket League (Team Entry)','Sports',  'Pune',       pg_temp.ist(20, '08:00'), 15000000, 'Team registration for a two-week tournament.',        'https://picsum.photos/seed/cricket/800/450',         true),
('Kids Science Carnival',               'Kids',     'Chennai',    pg_temp.ist(7,  '10:30'),    29900, 'Experiments and demos for ages 6 to 12.',              'https://picsum.photos/seed/science-kids/800/450',    true),
('Storytelling Hour for Kids',          'Kids',     'Mumbai',     pg_temp.ist(1,  '16:00'),        0, 'Stories and puppets for little ones.',                 'https://picsum.photos/seed/storytelling/800/450',    true),
-- Inactive, upcoming (2): must be hidden from visitors
('Sunset Yoga in the Park',             'Sports',   'Bengaluru',  pg_temp.ist(8,  '17:30'),    19900, 'Outdoor yoga session at sunset.',                      'https://picsum.photos/seed/yoga/800/450',            false),
('Baking Masterclass',                  'Workshop', 'Chennai',    pg_temp.ist(10, '14:00'),   150000, 'Breads and pastries with a professional baker.',       'https://picsum.photos/seed/baking/800/450',          false),
-- Past, active (2): must be hidden because they are not upcoming
('Diwali Food Festival',                'Food',     'Mumbai',     pg_temp.ist(-10, '18:00'),       0, 'Festive sweets and savouries.',                        'https://picsum.photos/seed/diwali-food/800/450',     true),
('Retro Music Night',                   'Music',    'Coimbatore', pg_temp.ist(-3, '21:00'),    59900, 'Songs from the 70s and 80s.',                          'https://picsum.photos/seed/retro-music/800/450',     true);

COMMIT;