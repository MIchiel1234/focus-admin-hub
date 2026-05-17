-- Seed data for self-hosted Supabase. Run this once in the SQL editor.
-- Safe to re-run: ON CONFLICT clauses skip duplicates.

INSERT INTO modules (code, title) VALUES
  ('TAX3761', 'Taxation of Business Activities')
ON CONFLICT (code) DO NOTHING;

INSERT INTO chapters (module_id, chapter_number, title, description)
SELECT m.id, v.chapter_number, v.title, v.description
FROM modules m
JOIN (VALUES
  ('TAX3761', 5, 'Capital Gains Tax', 'Disposal events, base cost, exclusions and inclusion rates.'),
  ('TAX3761', 6, 'Trusts & Estate Duty', 'Conduit principle, attribution rules and estate duty computation.')
) AS v(code, chapter_number, title, description) ON v.code = m.code
ON CONFLICT (module_id, chapter_number) DO NOTHING;
