-- Supabase 数据库初始化脚本
-- 在 Supabase Dashboard > SQL Editor 中运行

-- 全局计数器表
CREATE TABLE IF NOT EXISTS global_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  value BIGINT NOT NULL DEFAULT 1123
);

INSERT INTO global_counter (id, value) VALUES (1, 1123) ON CONFLICT DO NOTHING;

-- 原子递增计数器函数
CREATE OR REPLACE FUNCTION increment_counter()
RETURNS BIGINT AS $$
DECLARE
  new_val BIGINT;
BEGIN
  UPDATE global_counter SET value = value + 1 WHERE id = 1
  RETURNING value INTO new_val;
  RETURN new_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 展示区条目表
CREATE TABLE IF NOT EXISTS showcase_items (
  id BIGSERIAL PRIMARY KEY,
  thumbnail TEXT,
  caption TEXT,
  style TEXT,
  expression TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用行级安全
ALTER TABLE global_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE showcase_items ENABLE ROW LEVEL SECURITY;

-- 允许公开读取计数器
CREATE POLICY "public_read_counter" ON global_counter FOR SELECT USING (true);

-- 允许公开读取展示条目
CREATE POLICY "public_read_showcase" ON showcase_items FOR SELECT USING (true);

-- 允许公开插入展示条目
CREATE POLICY "public_insert_showcase" ON showcase_items FOR INSERT WITH CHECK (true);

-- 允许公开删除展示条目（用于清理旧数据）
CREATE POLICY "public_delete_showcase" ON showcase_items FOR DELETE USING (true);
