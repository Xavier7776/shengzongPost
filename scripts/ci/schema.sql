-- Synthetic build fixture, not a production baseline or a migration.
CREATE TABLE users (id int PRIMARY KEY, name text, email text, role text, avatar text, bio text);
CREATE TABLE posts (id serial PRIMARY KEY, slug text UNIQUE, title text, excerpt text, content text,
  tags text[] DEFAULT '{}', published boolean, author_id int, cover_image text,
  created_at timestamptz DEFAULT '2026-01-01', updated_at timestamptz DEFAULT '2026-01-01', view_count int DEFAULT 0);
CREATE TABLE skills (id serial PRIMARY KEY, slug text UNIQUE, name text, description text,
  chinese_summary text, content text, source_url text, source_type text, stars int DEFAULT 0,
  tags text[] DEFAULT '{}', category text, cover_image text,
  created_at timestamptz DEFAULT '2026-01-01', updated_at timestamptz DEFAULT '2026-01-01');
CREATE TABLE projects (id serial PRIMARY KEY, slug text UNIQUE, name text, tagline text, description text,
  content text, cover_image text, cover_public_id text, tech_stack text[] DEFAULT '{}',
  highlights text[] DEFAULT '{}', demo_url text, github_url text, year text,
  sort_order int DEFAULT 0, enabled boolean, attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT '2026-01-01', updated_at timestamptz DEFAULT '2026-01-01');
CREATE TABLE hero_slides (id int, img text, title text, subtitle text, sort_order int, enabled boolean, created_at timestamptz);
CREATE TABLE gallery_images (id int, url text, public_id text, title text, category text, description text,
  tags text[], width int, height int, likes int, is_featured boolean, sort_order int, created_at timestamptz);
CREATE TABLE comments (id int, status text);
CREATE TABLE post_reactions (id int, type text);
CREATE TABLE learn_editions (post_slug text, edition_date date, topic text, document jsonb);
INSERT INTO users VALUES (1,'CI fixture','fixture@example.invalid','user',NULL,'Synthetic profile');
INSERT INTO posts (slug,title,excerpt,content,tags,published,author_id) VALUES
  ('ci-public','CI public article','Build fixture','<p>Synthetic content</p>',ARRAY['CI'],true,1),
  ('ci-draft','CI hidden draft','','<p>Private fixture</p>',ARRAY['CI'],false,1);
INSERT INTO skills (slug,name,description,content,source_url,source_type,category)
  VALUES ('ci-skill','CI skill','Synthetic skill','Fixture','https://example.invalid/source','github','engineering');
INSERT INTO projects (slug,name,tagline,description,content,enabled)
  VALUES ('ci-project','CI project','Build fixture','Synthetic project','# CI project',true);
