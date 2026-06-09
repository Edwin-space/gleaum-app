-- 공간 멤버 닉네임
ALTER TABLE space_members ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 공간 게시물
CREATE TABLE IF NOT EXISTS space_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'general',
  content TEXT,
  pinned BOOLEAN NOT NULL DEFAULT false,
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS space_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES space_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS space_dues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES space_posts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  per_person INTEGER,
  due_date DATE
);

CREATE TABLE IF NOT EXISTS space_dues_payments (
  dues_id UUID NOT NULL REFERENCES space_dues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  PRIMARY KEY (dues_id, user_id)
);

CREATE TABLE IF NOT EXISTS space_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES space_posts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  multiple_choice BOOLEAN NOT NULL DEFAULT false,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS space_vote_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id UUID NOT NULL REFERENCES space_votes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS space_vote_results (
  option_id UUID NOT NULL REFERENCES space_vote_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (option_id, user_id)
);

-- RLS
ALTER TABLE space_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_dues ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_dues_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_vote_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_vote_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "space_posts_select" ON space_posts FOR SELECT USING (EXISTS (SELECT 1 FROM space_members WHERE space_id = space_posts.space_id AND user_id = auth.uid()));
CREATE POLICY "space_posts_insert" ON space_posts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM space_members WHERE space_id = space_posts.space_id AND user_id = auth.uid()) AND author_id = auth.uid());
CREATE POLICY "space_posts_update" ON space_posts FOR UPDATE USING (author_id = auth.uid() OR EXISTS (SELECT 1 FROM space_members WHERE space_id = space_posts.space_id AND user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "space_posts_delete" ON space_posts FOR DELETE USING (author_id = auth.uid() OR EXISTS (SELECT 1 FROM space_members WHERE space_id = space_posts.space_id AND user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "comments_select" ON space_post_comments FOR SELECT USING (EXISTS (SELECT 1 FROM space_posts sp JOIN space_members sm ON sm.space_id = sp.space_id WHERE sp.id = space_post_comments.post_id AND sm.user_id = auth.uid()));
CREATE POLICY "comments_insert" ON space_post_comments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM space_posts sp JOIN space_members sm ON sm.space_id = sp.space_id WHERE sp.id = space_post_comments.post_id AND sm.user_id = auth.uid()) AND author_id = auth.uid());
CREATE POLICY "comments_delete" ON space_post_comments FOR DELETE USING (author_id = auth.uid());

CREATE POLICY "dues_select" ON space_dues FOR SELECT USING (EXISTS (SELECT 1 FROM space_posts sp JOIN space_members sm ON sm.space_id = sp.space_id WHERE sp.id = space_dues.post_id AND sm.user_id = auth.uid()));
CREATE POLICY "dues_insert" ON space_dues FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM space_posts sp JOIN space_members sm ON sm.space_id = sp.space_id WHERE sp.id = space_dues.post_id AND sm.user_id = auth.uid()));
CREATE POLICY "dues_payments_select" ON space_dues_payments FOR SELECT USING (EXISTS (SELECT 1 FROM space_dues sd JOIN space_posts sp ON sp.id = sd.post_id JOIN space_members sm ON sm.space_id = sp.space_id WHERE sd.id = space_dues_payments.dues_id AND sm.user_id = auth.uid()));
CREATE POLICY "dues_payments_all" ON space_dues_payments FOR ALL USING (user_id = auth.uid());

CREATE POLICY "votes_select" ON space_votes FOR SELECT USING (EXISTS (SELECT 1 FROM space_posts sp JOIN space_members sm ON sm.space_id = sp.space_id WHERE sp.id = space_votes.post_id AND sm.user_id = auth.uid()));
CREATE POLICY "votes_insert" ON space_votes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM space_posts sp JOIN space_members sm ON sm.space_id = sp.space_id WHERE sp.id = space_votes.post_id AND sm.user_id = auth.uid()));
CREATE POLICY "vote_options_select" ON space_vote_options FOR SELECT USING (EXISTS (SELECT 1 FROM space_votes sv JOIN space_posts sp ON sp.id = sv.post_id JOIN space_members sm ON sm.space_id = sp.space_id WHERE sv.id = space_vote_options.vote_id AND sm.user_id = auth.uid()));
CREATE POLICY "vote_options_insert" ON space_vote_options FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM space_votes sv JOIN space_posts sp ON sp.id = sv.post_id JOIN space_members sm ON sm.space_id = sp.space_id WHERE sv.id = space_vote_options.vote_id AND sm.user_id = auth.uid()));
CREATE POLICY "vote_results_select" ON space_vote_results FOR SELECT USING (EXISTS (SELECT 1 FROM space_vote_options svo JOIN space_votes sv ON sv.id = svo.vote_id JOIN space_posts sp ON sp.id = sv.post_id JOIN space_members sm ON sm.space_id = sp.space_id WHERE svo.id = space_vote_results.option_id AND sm.user_id = auth.uid()));
CREATE POLICY "vote_results_all" ON space_vote_results FOR ALL USING (user_id = auth.uid());

CREATE POLICY "space_members_nickname_update" ON space_members FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
