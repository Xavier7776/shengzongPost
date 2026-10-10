CREATE TABLE users(id int PRIMARY KEY,points int NOT NULL);
CREATE TABLE posts(id serial PRIMARY KEY,slug text UNIQUE,title text,excerpt text,tags text[],published boolean,view_count int,created_at timestamptz,updated_at timestamptz);
CREATE TABLE point_transactions(id serial PRIMARY KEY,user_id int REFERENCES users(id),amount int,reason text,ref_slug text,created_at timestamptz DEFAULT NOW(),
  CHECK(ref_slug IS DISTINCT FROM 'frame_bad' AND ref_slug IS DISTINCT FROM 'bad' AND ref_slug NOT LIKE '%00000000-0000-4000-8000-000000000099'));
CREATE TABLE avatar_frames(id int PRIMARY KEY,key text,name text,price int,enabled boolean);
CREATE TABLE cursor_effects(id int PRIMARY KEY,key text,name text,price int,enabled boolean);
CREATE TABLE user_frames(user_id int REFERENCES users(id),frame_id int REFERENCES avatar_frames(id),UNIQUE(user_id,frame_id));
CREATE TABLE user_cursor_effects(user_id int REFERENCES users(id),effect_id int REFERENCES cursor_effects(id),UNIQUE(user_id,effect_id));
CREATE TABLE bookmarks(id serial PRIMARY KEY,post_slug text,user_id int REFERENCES users(id),created_at timestamptz DEFAULT NOW(),UNIQUE(post_slug,user_id));
CREATE TABLE post_reactions(id serial PRIMARY KEY,post_slug text,user_id int REFERENCES users(id),type text,UNIQUE(post_slug,user_id));
CREATE TABLE point_read_log(user_id int,post_slug text,PRIMARY KEY(user_id,post_slug));
CREATE TABLE comments(id int PRIMARY KEY,post_slug text,user_id int REFERENCES users(id),status text);
INSERT INTO users VALUES(7,100),(8,4000);
INSERT INTO posts(slug,published,view_count) VALUES('public',true,0),('draft',false,0),('bad',true,0);
INSERT INTO avatar_frames VALUES(1,'one','One',60,true),(2,'two','Two',60,true),(3,'bad','Bad',20,true),(4,'negative','Negative',-10,true),(5,'disabled','Disabled',0,false),(6,'free','Free',0,true);
INSERT INTO cursor_effects VALUES(1,'one','One',60,true),(2,'two','Two',60,true);
INSERT INTO comments VALUES(1,'public',7,'pending'),(2,'public',7,'pending'),(3,'draft',7,'pending'),(4,'bad',7,'pending');
