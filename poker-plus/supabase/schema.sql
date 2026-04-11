-- ============================================================
-- Poker+ Community Schema
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)
-- ============================================================

-- ── 1. profiles ────────────────────────────────────────────
CREATE TABLE profiles (
  id                  UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname            TEXT        NOT NULL UNIQUE,
  avatar_url          TEXT,
  bio                 TEXT        CHECK (char_length(bio) <= 100),
  post_count          INTEGER     DEFAULT 0,
  nickname_changed_at TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  poker_terms TEXT[] := ARRAY['River','Flop','Turn','Bluff','Check','Fold','Raise',
                               'Call','Bet','Pot','Allin','Equity','GTO','Nuts',
                               'Blind','Button','Dealer','Stack','Range','Board'];
  random_term TEXT;
  random_num  TEXT;
  new_nickname TEXT;
BEGIN
  random_term := poker_terms[1 + floor(random() * array_length(poker_terms, 1))::int];
  random_num  := lpad(floor(random() * 9000 + 1000)::TEXT, 4, '0');
  new_nickname := random_term || '_' || random_num;

  INSERT INTO profiles (id, nickname)
  VALUES (NEW.id, new_nickname)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 2. posts ───────────────────────────────────────────────
CREATE TABLE posts (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID    NOT NULL REFERENCES profiles(id),
  type          TEXT    NOT NULL CHECK (type IN ('replay', 'discussion')),
  title         TEXT    NOT NULL CHECK (char_length(title) BETWEEN 3 AND 100),
  body          TEXT,
  replay_data   JSONB,
  tags          TEXT[]  DEFAULT '{}',
  like_count    INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_hidden     BOOLEAN DEFAULT FALSE,
  hide_reason   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_user_id    ON posts(user_id);
CREATE INDEX idx_posts_type       ON posts(type);

-- ── 3. comments ────────────────────────────────────────────
CREATE TABLE comments (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID    NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID    NOT NULL REFERENCES profiles(id),
  parent_id   UUID    REFERENCES comments(id) ON DELETE CASCADE,
  reply_to_id UUID    REFERENCES comments(id),
  content     TEXT    NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  like_count  INTEGER DEFAULT 0,
  is_hidden   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post_id   ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

-- ── 4. likes ───────────────────────────────────────────────
CREATE TABLE likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id   UUID NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)
);

-- ── 5. reports ─────────────────────────────────────────────
CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user')),
  target_id   UUID NOT NULL,
  reason      TEXT NOT NULL CHECK (reason IN (
                 'gambling_recruitment','spam','harassment','inappropriate','other')),
  detail      TEXT,
  status      TEXT DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. blocked_keywords (hot-update via Dashboard) ─────────
CREATE TABLE blocked_keywords (
  id       SERIAL PRIMARY KEY,
  keyword  TEXT   NOT NULL UNIQUE,
  category TEXT   NOT NULL,
  active   BOOLEAN DEFAULT TRUE
);

-- ── 7. notifications ────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type        TEXT NOT NULL CHECK (type IN ('like_post', 'like_comment', 'comment', 'reply')),
  target_type TEXT CHECK (target_type IN ('post', 'comment')),
  target_id   UUID,
  message     TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id, created_at DESC);

-- ── 8. saved_games ─────────────────────────────────────────
CREATE TABLE saved_games (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_data   JSONB   NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_games_user_id ON saved_games(user_id, created_at DESC);

-- ── 9. ledger_records ──────────────────────────────────────
CREATE TABLE ledger_records (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  record_data JSONB   NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ledger_records_user_id ON ledger_records(user_id, created_at DESC);

-- ── 10. Triggers: maintain count fields ─────────────────────

-- post like_count
CREATE OR REPLACE FUNCTION update_post_like_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'post' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'post' THEN
    UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.target_id;
  END IF;
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_post_like_count
  AFTER INSERT OR DELETE ON likes FOR EACH ROW
  EXECUTE FUNCTION update_post_like_count();

-- comment like_count
CREATE OR REPLACE FUNCTION update_comment_like_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'comment' THEN
    UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'comment' THEN
    UPDATE comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.target_id;
  END IF;
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comment_like_count
  AFTER INSERT OR DELETE ON likes FOR EACH ROW
  EXECUTE FUNCTION update_comment_like_count();

-- post comment_count
CREATE OR REPLACE FUNCTION update_post_comment_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_post_comment_count
  AFTER INSERT OR DELETE ON comments FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

-- post_count on profiles
CREATE OR REPLACE FUNCTION update_profile_post_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET post_count = post_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET post_count = GREATEST(post_count - 1, 0) WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profile_post_count
  AFTER INSERT OR DELETE ON posts FOR EACH ROW
  EXECUTE FUNCTION update_profile_post_count();

-- ── 11. RLS ─────────────────────────────────────────────────
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_games   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_records ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_public_read"  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own_insert"   ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_own_update"   ON profiles FOR UPDATE USING (auth.uid() = id);

-- posts
CREATE POLICY "posts_public_read"  ON posts FOR SELECT USING (is_hidden = false);
CREATE POLICY "posts_auth_insert"  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_own_update"   ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_own_delete"   ON posts FOR DELETE USING (auth.uid() = user_id);

-- comments
CREATE POLICY "comments_public_read" ON comments FOR SELECT USING (is_hidden = false);
CREATE POLICY "comments_auth_insert" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_own_delete"  ON comments FOR DELETE USING (auth.uid() = user_id);

-- likes
CREATE POLICY "likes_public_read" ON likes FOR SELECT USING (true);
CREATE POLICY "likes_auth_manage" ON likes FOR ALL   USING (auth.uid() = user_id);

-- reports
CREATE POLICY "reports_auth_insert" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- notifications
CREATE POLICY "notifications_own_read"   ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_own_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- saved_games
CREATE POLICY "saved_games_own_all" ON saved_games FOR ALL USING (auth.uid() = user_id);

-- ledger_records
CREATE POLICY "ledger_records_own_all" ON ledger_records FOR ALL USING (auth.uid() = user_id);
