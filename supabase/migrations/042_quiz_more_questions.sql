-- Migration 042: Add 100+ quiz questions across multiple categories
-- Categories: relationship, preference, memory, hypothetical, fun, choice

-- Relationship questions (open)
INSERT INTO public.quiz_questions (question_text, question_type, category)
SELECT * FROM (VALUES
  ('我们第一次见面是在哪里？', 'open', 'relationship'),
  ('你对我的第一印象是什么？', 'open', 'relationship'),
  ('我们第一次约会去了哪里？', 'open', 'relationship'),
  ('你觉得我们关系中最特别的时刻是什么？', 'open', 'relationship'),
  ('你最喜欢我们一起做的什么事？', 'open', 'relationship'),
  ('你觉得我最吸引你的地方是什么？', 'open', 'relationship'),
  ('我们之间最有意义的一次对话是什么？', 'open', 'relationship'),
  ('你希望我们一起完成的一件事是什么？', 'open', 'relationship'),
  ('你觉得我们的关系像哪种天气？为什么？', 'open', 'relationship'),
  ('如果用一首歌形容我们的关系，你会选哪首？', 'open', 'relationship'),
  ('你最感谢我做过的什么事？', 'open', 'relationship'),
  ('你觉得我们在一起后你最大的变化是什么？', 'open', 'relationship'),
  ('你最想和我一起旅行去哪里？', 'open', 'relationship'),
  ('你觉得我们吵架时最好的和好方式是什么？', 'open', 'relationship'),
  ('你最珍惜我们之间的哪个习惯？', 'open', 'relationship')
) AS t(question_text, question_type, category)
WHERE NOT EXISTS (SELECT 1 FROM public.quiz_questions q WHERE q.question_text = t.question_text);

-- Preference questions (open)
INSERT INTO public.quiz_questions (question_text, question_type, category)
SELECT * FROM (VALUES
  ('Ta 最喜欢的颜色是什么？', 'open', 'preference'),
  ('Ta 最喜欢的食物是什么？', 'open', 'preference'),
  ('Ta 最喜欢的电影类型是什么？', 'open', 'preference'),
  ('Ta 最喜欢的音乐类型是什么？', 'open', 'preference'),
  ('Ta 最喜欢的季节是什么？', 'open', 'preference'),
  ('Ta 最喜欢的运动或活动是什么？', 'open', 'preference'),
  ('Ta 最喜欢的书或漫画是什么？', 'open', 'preference'),
  ('Ta 最喜欢的饮品是什么？', 'open', 'preference'),
  ('Ta 最喜欢穿什么风格的衣服？', 'open', 'preference'),
  ('Ta 最喜欢的放松方式是什么？', 'open', 'preference'),
  ('Ta 最想去哪个国家旅行？', 'open', 'preference'),
  ('Ta 最喜欢的节日是什么？', 'open', 'preference'),
  ('Ta 最喜欢的动物是什么？', 'open', 'preference'),
  ('Ta 最喜欢的时间段是早上还是晚上？', 'open', 'preference'),
  ('Ta 最喜欢的社交媒体平台是什么？', 'open', 'preference')
) AS t(question_text, question_type, category)
WHERE NOT EXISTS (SELECT 1 FROM public.quiz_questions q WHERE q.question_text = t.question_text);

-- Memory questions (open)
INSERT INTO public.quiz_questions (question_text, question_type, category)
SELECT * FROM (VALUES
  ('你最怀念我们一起做的什么事？', 'open', 'memory'),
  ('我们一起去过的最远的地方是哪里？', 'open', 'memory'),
  ('你记得我们第一次牵手是什么时候吗？', 'open', 'memory'),
  ('我们一起看过的第一部电影是什么？', 'open', 'memory'),
  ('你最难忘的一次约会是哪次？', 'open', 'memory'),
  ('我们一起经历过的最搞笑的事是什么？', 'open', 'memory'),
  ('你收到过我送的最喜欢的礼物是什么？', 'open', 'memory'),
  ('我们一起拍的最喜欢的照片是哪张？', 'open', 'memory'),
  ('你最感动的一次是因为什么事？', 'open', 'memory'),
  ('我们一起做过最疯狂的事是什么？', 'open', 'memory'),
  ('你还记得我们第一次吵架是因为什么吗？', 'open', 'memory'),
  ('我们一起吃过的最好吃的一餐是什么？', 'open', 'memory'),
  ('你最珍惜我们一起度过的哪个节日？', 'open', 'memory'),
  ('我们一起经历过的最困难的时候是什么？', 'open', 'memory'),
  ('你最想重温的我们一起的哪一天？', 'open', 'memory')
) AS t(question_text, question_type, category)
WHERE NOT EXISTS (SELECT 1 FROM public.quiz_questions q WHERE q.question_text = t.question_text);

-- Hypothetical questions (open)
INSERT INTO public.quiz_questions (question_text, question_type, category)
SELECT * FROM (VALUES
  ('如果可以穿越时空，你想回到我们在一起的哪一天？', 'open', 'hypothetical'),
  ('如果我们有一百万，你最想用来做什么？', 'open', 'hypothetical'),
  ('如果可以拥有超能力，你想要什么？', 'open', 'hypothetical'),
  ('如果明天是世界末日，你最想和我做什么？', 'open', 'hypothetical'),
  ('如果可以和任何名人吃晚餐，你选谁？', 'open', 'hypothetical'),
  ('如果我们在电影里，你觉得会是什么类型？', 'open', 'hypothetical'),
  ('如果可以住在全球任何地方，你想住哪里？', 'open', 'hypothetical'),
  ('如果可以改变过去的一件事，你会改什么？', 'open', 'hypothetical'),
  ('如果我们互换身体一天，你最想做什么？', 'open', 'hypothetical'),
  ('如果可以实现三个愿望，你会许什么？', 'open', 'hypothetical'),
  ('如果能回到过去给年轻时的自己一个建议，你会说什么？', 'open', 'hypothetical'),
  ('如果你能读我的心，你最想知道什么？', 'open', 'hypothetical'),
  ('如果我们可以养任何动物当宠物，你选什么？', 'open', 'hypothetical'),
  ('如果必须在荒岛上生活一年，你会带三样什么？', 'open', 'hypothetical'),
  ('如果可以瞬间学会一项技能，你想学什么？', 'open', 'hypothetical')
) AS t(question_text, question_type, category)
WHERE NOT EXISTS (SELECT 1 FROM public.quiz_questions q WHERE q.question_text = t.question_text);

-- Fun questions (open)
INSERT INTO public.quiz_questions (question_text, question_type, category)
SELECT * FROM (VALUES
  ('用一个词形容我们的关系？', 'open', 'fun'),
  ('你觉得我最像哪种动物？', 'open', 'fun'),
  ('你觉得我们的关系像哪对 fictional 情侣？', 'open', 'fun'),
  ('如果你要给我取一个外号，你会叫什么？', 'open', 'fun'),
  ('你觉得我最可爱的习惯是什么？', 'open', 'fun'),
  ('你觉得我最奇怪的习惯是什么？', 'open', 'fun'),
  ('如果我是一道菜，你觉得会是什么？', 'open', 'fun'),
  ('你觉得我们的关系会得什么奖？', 'open', 'fun'),
  ('如果给我们的关系画一幅画，你会画什么？', 'open', 'fun'),
  ('你觉得我最大的优点和缺点分别是什么？', 'open', 'fun'),
  ('如果你要向别人介绍我，你会怎么说？', 'open', 'fun'),
  ('你觉得我最擅长什么？', 'open', 'fun'),
  ('你觉得我们老了以后会是什么样子？', 'open', 'fun'),
  ('如果我们的关系有主题曲，你觉得是什么？', 'open', 'fun'),
  ('你觉得我做的最浪漫的事是什么？', 'open', 'fun')
) AS t(question_text, question_type, category)
WHERE NOT EXISTS (SELECT 1 FROM public.quiz_questions q WHERE q.question_text = t.question_text);

-- Choice questions
INSERT INTO public.quiz_questions (question_text, question_type, options, category)
SELECT * FROM (VALUES
  ('周末更喜欢做什么？', 'choice', '["宅家休息","出门逛街","户外运动","看电影"]'::jsonb, 'preference'),
  ('约会的理想地点？', 'choice', '["餐厅","电影院","公园","家里"]'::jsonb, 'preference'),
  ('喜欢的拥抱方式？', 'choice', '["背后拥抱","面对面拥抱","头靠肩膀","牵手"]'::jsonb, 'preference'),
  ('理想的旅行方式？', 'choice', '["自由行","跟团","自驾","骑行"]'::jsonb, 'preference'),
  ('更喜欢哪种天气约会？', 'choice', '["晴天野餐","雨天窝家","雪天散步","秋日郊游"]'::jsonb, 'preference'),
  ('喜欢的睡前活动？', 'choice', '["聊天","看剧","听音乐","各自玩手机"]'::jsonb, 'preference'),
  ('更喜欢哪种纪念日庆祝？', 'choice', '["大餐","旅行","宅家","惊喜礼物"]'::jsonb, 'preference'),
  ('理想的晚餐时间？', 'choice', '["5点","6点","7点","8点以后"]'::jsonb, 'preference'),
  ('更喜欢甜的还是咸的？', 'choice', '["甜食","咸食","都喜欢","都不喜欢"]'::jsonb, 'preference'),
  ('早起还是熬夜？', 'choice', '["早起鸟","夜猫子","看情况","都是"]'::jsonb, 'preference'),
  ('更喜欢哪种运动？', 'choice', '["跑步","游泳","瑜伽","不运动"]'::jsonb, 'preference'),
  ('喜欢的音乐类型？', 'choice', '["流行","摇滚","民谣","电子"]'::jsonb, 'preference'),
  ('更喜欢猫还是狗？', 'choice', '["猫","狗","都喜欢","都不喜欢"]'::jsonb, 'preference'),
  ('喜欢的城市类型？', 'choice', '["大城市","小城镇","海边","山区"]'::jsonb, 'preference'),
  ('更喜欢哪种电影？', 'choice', '["喜剧","爱情","动作","悬疑"]'::jsonb, 'preference'),
  ('理想的生日庆祝方式？', 'choice', '["派对","二人世界","旅行","收到惊喜"]'::jsonb, 'preference'),
  ('更喜欢哪种沟通方式？', 'choice', '["面对面","电话","文字","视频"]'::jsonb, 'preference'),
  ('喜欢的穿衣风格？', 'choice', '["休闲","正式","运动","混搭"]'::jsonb, 'preference'),
  ('更喜欢哪种甜点？', 'choice', '["蛋糕","冰淇淋","巧克力","水果"]'::jsonb, 'preference'),
  ('理想的周末节奏？', 'choice', '["满满行程","半休闲","完全躺平","看心情"]'::jsonb, 'preference')
) AS t(question_text, question_type, options, category)
WHERE NOT EXISTS (SELECT 1 FROM public.quiz_questions q WHERE q.question_text = t.question_text);
