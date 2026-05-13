-- ============ More Quiz Questions ============

INSERT INTO "public"."quiz_questions" ("question_text", "question_type", "options", "category")
SELECT v.* FROM (VALUES
  -- 开放题：日常偏好
  ('Ta最常用的口头禅是什么？', 'open', NULL::jsonb, 'preference'),
  ('Ta手机里用得最多的App是什么？', 'open', NULL::jsonb, 'preference'),
  ('Ta最讨厌做什么家务？', 'open', NULL::jsonb, 'preference'),
  ('Ta心情不好时最喜欢做什么？', 'open', NULL::jsonb, 'emotion'),
  ('Ta最害怕什么东西？', 'open', NULL::jsonb, 'emotion'),
  ('Ta小时候的梦想职业是什么？', 'open', NULL::jsonb, 'past'),
  ('Ta最想去哪个国家旅行？', 'open', NULL::jsonb, 'preference'),
  ('Ta最喜欢的一首歌是什么？', 'open', NULL::jsonb, 'preference'),
  ('Ta最拿手的一道菜是什么？', 'open', NULL::jsonb, 'preference'),
  ('Ta最珍惜的一件物品是什么？', 'open', NULL::jsonb, 'emotion'),
  ('Ta最喜欢什么颜色？', 'open', NULL::jsonb, 'preference'),
  ('Ta最难忘的一次约会是什么？', 'open', NULL::jsonb, 'emotion'),
  ('Ta最近在追什么剧？', 'open', NULL::jsonb, 'preference'),
  ('Ta最想改掉的一个习惯是什么？', 'open', NULL::jsonb, 'self'),
  ('Ta觉得最浪漫的事是什么？', 'open', NULL::jsonb, 'emotion'),
  ('Ta最喜欢什么运动？', 'open', NULL::jsonb, 'preference'),
  ('Ta最擅长的科目是什么？', 'open', NULL::jsonb, 'past'),
  ('Ta最想养什么宠物？', 'open', NULL::jsonb, 'preference'),
  ('Ta最喜欢什么花？', 'open', NULL::jsonb, 'preference'),
  ('Ta最想对我说的一句话是什么？', 'open', NULL::jsonb, 'emotion'),

  -- 选择题
  ('Ta更喜欢猫还是狗？', 'choice', '["猫咪","狗狗","都喜欢","都不养"]'::jsonb, 'preference'),
  ('Ta喜欢宅家还是出门？', 'choice', '["宅家","出门","看心情"]'::jsonb, 'preference'),
  ('Ta是早起型还是熬夜型？', 'choice', '["早起鸟","夜猫子","看情况"]'::jsonb, 'preference'),
  ('Ta喜欢甜口还是咸口？', 'choice', '["甜口","咸口","都喜欢"]'::jsonb, 'preference'),
  ('Ta更喜欢夏天还是冬天？', 'choice', '["夏天","冬天","都喜欢","都不喜欢"]'::jsonb, 'preference'),
  ('Ta约会更喜欢吃什么？', 'choice', '["火锅","西餐","日料","烧烤","奶茶甜品"]'::jsonb, 'preference'),
  ('Ta喜欢收花还是送花？', 'choice', '["收花","送花","都喜欢","不需要"]'::jsonb, 'preference'),
  ('Ta更在意纪念日还是生日？', 'choice', '["纪念日","生日","都重要","都不在意"]'::jsonb, 'preference'),
  ('Ta喜欢惊喜还是提前知道？', 'choice', '["喜欢惊喜","喜欢提前知道","无所谓"]'::jsonb, 'preference'),
  ('Ta拍照喜欢自拍还是被拍？', 'choice', '["自拍","被拍","都不喜欢","都喜欢"]'::jsonb, 'preference'),
  ('Ta更喜欢晴天还是雨天？', 'choice', '["晴天","雨天","都可以"]'::jsonb, 'preference'),
  ('Ta喜欢打电话还是发消息？', 'choice', '["打电话","发消息","视频通话"]'::jsonb, 'preference'),
  ('Ta更喜欢看日出还是日落？', 'choice', '["日出","日落","都喜欢"]'::jsonb, 'preference'),
  ('Ta喜欢计划旅行还是说走就走？', 'choice', '["详细计划","说走就走","大致规划就好"]'::jsonb, 'preference'),
  ('Ta更喜欢城市还是自然风景？', 'choice', '["城市","自然风景","都喜欢"]'::jsonb, 'preference'),

  -- 趣味题
  ('如果变成动物，Ta觉得自己会是什么？', 'open', NULL::jsonb, 'fun'),
  ('如果中了彩票，Ta第一件事会做什么？', 'open', NULL::jsonb, 'fun'),
  ('如果只能吃一种食物吃一辈子，Ta会选什么？', 'open', NULL::jsonb, 'fun'),
  ('如果可以拥有超能力，Ta会选什么？', 'choice', '["读心术","隐身","时光倒流","飞行","瞬移"]'::jsonb, 'fun'),
  ('如果要演一部电影，Ta想演什么类型？', 'choice', '["浪漫爱情","动作冒险","喜剧","科幻","悬疑推理"]'::jsonb, 'fun')
) AS v(question_text, question_type, options, category)
WHERE NOT EXISTS (
  SELECT 1 FROM quiz_questions WHERE question_text = v.question_text
);

-- ============ More Medals ============

INSERT INTO "public"."medals" ("medal_key", "title", "description", "emoji", "category", "threshold")
VALUES
  ('first_goodnight', '初次晚安', '完成第一次晚安打卡', '🌙', 'achievement', NULL),
  ('streak_7_goodnight', '连续7天晚安', '连续7天完成晚安打卡', '💤', 'streak', 7),
  ('streak_30_morning', '月度早安', '连续30天完成早安打卡', '☀️', 'streak', 30),
  ('streak_30_goodnight', '月度晚安', '连续30天完成晚安打卡', '🌜', 'streak', 30),
  ('first_pet', '宠物家长', '领养了第一只宠物', '🐾', 'achievement', NULL),
  ('pet_level_5', '宠物达人', '宠物升到5级', '🐱', 'achievement', 5),
  ('pet_level_10', '宠物大师', '宠物升到10级', '🦁', 'achievement', 10),
  ('first_drawing', '小画家', '完成第一次画画猜猜', '🎨', 'achievement', NULL),
  ('quiz_10', '问答达人', '累计完成10次双人问答', '🎯', 'achievement', 10),
  ('quiz_50', '灵魂伴侣', '累计完成50次双人问答', '💞', 'achievement', 50),
  ('first_expense', '账单新手', '记录了第一笔共同账单', '💰', 'achievement', NULL),
  ('expense_10', '理财搭档', '累计记录10笔账单', '📊', 'achievement', 10),
  ('bucket_10', '心愿收集家', '添加了10个心愿', '📋', 'achievement', 10),
  ('bucket_complete_10', '圆梦达人', '完成10个心愿', '🎉', 'achievement', 10),
  ('days_50', '半百之约', '在一起50天', '🌸', 'milestone', 50),
  ('days_999', '久久久', '在一起999天', '💍', 'milestone', 999),
  ('both_morning', '同步早安', '两人同时完成早安打卡', '🤝', 'achievement', NULL),
  ('both_goodnight', '同步晚安', '两人同时完成晚安打卡', '💑', 'achievement', NULL),
  ('streak_100_morning', '百日早安', '连续100天完成早安打卡', '👑', 'streak', 100),
  ('streak_100_goodnight', '百日晚安', '连续100天完成晚安打卡', '🏆', 'streak', 100)
ON CONFLICT (medal_key) DO NOTHING;
