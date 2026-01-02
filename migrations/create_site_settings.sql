-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default landing page text
INSERT INTO site_settings (key, value)
VALUES (
  'landing_page_text',
  '<p>This gallery showcases some of my Asian artwork collections over 20 years. Please click on each category gallery to see collections. Most artwork are marked with prices, but if you are interested in any collection, please contact me.</p><p>这是本人多年下来的部分藏品. 我尽力描述准确. 对于藏品的年代和作者, 我都从各方面考虑, 力求精确. 每一件藏品, 都有我大量的考椐工作. 请点击小面小图以浏览各个藏品. 藏品介绍用中英文标出. 多数藏品有标价, 但如果你对任何一件艺术品感兴趣， 请联系我们</p>'
) ON CONFLICT (key) DO NOTHING;
