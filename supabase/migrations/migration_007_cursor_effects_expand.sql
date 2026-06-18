-- migration_007: 扩充鼠标效果至 20 款 + 调大尺寸 + 重排价格稀有度

-- 1) 调大现有 6 款的 scale（按稀有度分层：common 88 / rare 96 / epic 104 / legendary 120）并重排价格
UPDATE cursor_effects SET scale = 88,  price = 100, rarity = 'common'    WHERE key = 'moochi';
UPDATE cursor_effects SET scale = 88,  price = 150, rarity = 'common'    WHERE key = 'rubber-duck';
UPDATE cursor_effects SET scale = 96,  price = 500, rarity = 'rare'      WHERE key = 'grey-white-cat';
UPDATE cursor_effects SET scale = 104, price = 2500, rarity = 'epic'     WHERE key = 'cthulhu';
UPDATE cursor_effects SET scale = 104, price = 3000, rarity = 'epic'     WHERE key = 'weary-office-worker';
UPDATE cursor_effects SET scale = 120, price = 8000, rarity = 'legendary' WHERE key = 'astra';

-- 2) 新增 14 款（覆盖 common/rare/epic/legendary）
INSERT INTO cursor_effects (key, name, description, price, rarity, sprite_url, emoji, scale, follow_easing) VALUES
  ('gray-budgie',       '灰色虎皮雀',   '紧凑的灰色虎皮鹦鹉，依参考照片绘制，灵动小眼',   200, 'common',    '/cursor-effects/gray-budgie.webp',       '🦜', 88,  0.15),
  ('binggan',           '金渐层小猫',   '真实感金渐层幼猫，浓密 layered 毛发，圆脸大眼',  250, 'common',    '/cursor-effects/binggan.webp',           '🐱', 88,  0.13),
  ('le-chaton-fat',     '胖橘猫',       '病态肥胖的橘猫，面无表情的皇家气质，慵懒随行',   300, 'common',    '/cursor-effects/le-chaton-fat.webp',     '😺', 88,  0.10),
  ('yoyo-melody',       '旋律小人',     '光泽 3D 玩具风音乐角色，红色兜帽与苍白面庞',     350, 'common',    '/cursor-effects/yoyo-melody.webp',       '🎵', 88,  0.14),
  ('yoyo-star',         '星光小人',     '光泽 3D 玩具风星星身体小人，红色点缀闪亮登场',   400, 'common',    '/cursor-effects/yoyo-star.webp',         '⭐', 88,  0.16),
  ('ponyo-ci-v3',       '波妞',         '同人 chibi 红发海之子，圆脸大眼，浪花随行',       450, 'common',    '/cursor-effects/ponyo-ci-v3.webp',       '🐟', 88,  0.14),
  ('putao-parrot',      '葡萄鹦鹉',     '毛茸茸紫色鹦鹉，洁白头部，葡萄般的紫色羽衣',     600, 'rare',      '/cursor-effects/putao-parrot.webp',      '🦜', 96,  0.13),
  ('pakaqiu',           '帕卡球',       '原创欢快黄色电火花桌面宠物，圆滚滚元气满满',     700, 'rare',      '/cursor-effects/pakaqiu.webp',           '⚡', 96,  0.15),
  ('shishimaru-2',      '狮子丸',       '狮子丸二代，散步巡逻展品，偶有展翅与水属性形态', 800, 'rare',      '/cursor-effects/shishimaru-2.webp',      '🦁', 96,  0.12),
  ('white-hat-mage',    '白帽法师',     'chibi 贴纸风金发紫眼白帽法师，灵动施法姿态',     900, 'rare',      '/cursor-effects/white-hat-mage.webp',    '🧙', 96,  0.13),
  ('huasha-tu',         '花纱兔',       '可爱动漫新娘兔，花纱头饰，温婉可人的兔子精灵',   1000,'rare',      '/cursor-effects/huasha-tu.webp',         '🐰', 96,  0.14),
  ('qpao',              '气泡少女',     '可爱 chibi 功夫少女吉祥物，元气满满的武术姿态',  1500,'epic',      '/cursor-effects/qpao.webp',              '👧', 104, 0.13),
  ('firefly-original',  '流萤',         'chibi 动漫流萤，银白长发，温润坚定的目光',       2000,'epic',      '/cursor-effects/firefly-original.webp',  '🔥', 104, 0.14),
  ('helmet-bunny',      '头盔兔',       '得意白兔戴黄色安全帽，说话时一抖一抖的俏皮样',   5000,'legendary', '/cursor-effects/helmet-bunny.webp',      '🐰', 120, 0.12)
ON CONFLICT (key) DO NOTHING;
