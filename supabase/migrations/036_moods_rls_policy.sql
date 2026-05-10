-- moods 表缺少 RLS policy，导致查询被静默拒绝返回空数据
CREATE POLICY "allow_all_moods" ON public.moods FOR ALL USING (true) WITH CHECK (true);
