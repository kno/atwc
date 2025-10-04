CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

CREATE TABLE IF NOT EXISTS tg_chats (
  chat_id BIGINT PRIMARY KEY,
  type TEXT CHECK (type IN ('private','group','supergroup','channel')),
  title TEXT,
  username TEXT
);

CREATE TABLE IF NOT EXISTS tg_users (
  user_id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT
);

CREATE TABLE IF NOT EXISTS tg_messages (
  chat_id BIGINT NOT NULL REFERENCES tg_chats(chat_id) ON DELETE CASCADE,
  message_id BIGINT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  from_user_id BIGINT REFERENCES tg_users(user_id),
  text_plain TEXT DEFAULT '',
  media_type TEXT DEFAULT 'none',
  media_caption TEXT DEFAULT '',
  reply_to BIGINT,
  has_links BOOLEAN DEFAULT FALSE,
  media_text TEXT DEFAULT '',
  text_fts tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', coalesce(text_plain,'')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(media_caption,'')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(media_text,'')), 'C')
  ) STORED,
  PRIMARY KEY (chat_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_text_fts ON tg_messages USING GIN (text_fts);
CREATE INDEX IF NOT EXISTS idx_messages_date_brin ON tg_messages USING BRIN (date);
CREATE INDEX IF NOT EXISTS idx_messages_trgm ON tg_messages USING GIN (text_plain gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_messages_from ON tg_messages (from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_media ON tg_messages (media_type);
