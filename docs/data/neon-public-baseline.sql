-- Blog Neon public baseline 2026-10-10. No data, ownership, ACL or managed neon_auth schema.
-- Use psql17.11 ON_ERROR_STOP and a single transaction on a new isolated empty database only.
-- Never apply with the legacy migration runner or against production.
--
-- PostgreSQL database dump
--

\restrict Q4Gps8qOjmxlZJO3zpjOemflQQwnO0imX4DadVa2X4fBY6pvxeARALSMSsbQ9o1

-- Dumped from database version 17.11 (7d7ea2a)
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- public is supplied by PostgreSQL template0; restore only into a verified empty database.


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auth_rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_rate_limits (
    scope text NOT NULL,
    subject_hash character(64) NOT NULL,
    window_started_at timestamp with time zone DEFAULT now() NOT NULL,
    hit_count integer DEFAULT 0 NOT NULL,
    CONSTRAINT auth_rate_limits_hit_count_check CHECK ((hit_count >= 0)),
    CONSTRAINT auth_rate_limits_scope_check CHECK (((length(scope) >= 2) AND (length(scope) <= 48)))
);


--
-- Name: avatar_frames; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.avatar_frames (
    id integer NOT NULL,
    key character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    price integer DEFAULT 0 NOT NULL,
    rarity character varying(20) DEFAULT 'common'::character varying NOT NULL,
    css_key character varying(50) NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: avatar_frames_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.avatar_frames_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avatar_frames_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.avatar_frames_id_seq OWNED BY public.avatar_frames.id;


--
-- Name: bookmarks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookmarks (
    id integer NOT NULL,
    post_slug text NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: bookmarks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bookmarks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bookmarks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bookmarks_id_seq OWNED BY public.bookmarks.id;


--
-- Name: comment_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comment_likes (
    id integer NOT NULL,
    comment_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: comment_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comment_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comment_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comment_likes_id_seq OWNED BY public.comment_likes.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    post_slug text NOT NULL,
    user_id integer NOT NULL,
    user_name text NOT NULL,
    content text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    parent_id integer
);


--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: cursor_effects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cursor_effects (
    id integer NOT NULL,
    key character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    price integer DEFAULT 0 NOT NULL,
    rarity character varying(20) DEFAULT 'common'::character varying NOT NULL,
    sprite_url text,
    cols integer DEFAULT 8 NOT NULL,
    rows integer DEFAULT 9 NOT NULL,
    fps integer DEFAULT 10 NOT NULL,
    frame_width integer DEFAULT 192 NOT NULL,
    frame_height integer DEFAULT 208 NOT NULL,
    scale integer DEFAULT 56 NOT NULL,
    follow_easing real DEFAULT 0.12 NOT NULL,
    state_map text DEFAULT '{"idle":0,"runRight":1,"runLeft":2}'::text NOT NULL,
    emoji character varying(10) DEFAULT '👻'::character varying NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    render_type character varying(20) DEFAULT 'sprite_sheet'::character varying NOT NULL,
    poster_url text,
    CONSTRAINT check_render_type CHECK (((render_type)::text = ANY ((ARRAY['sprite_sheet'::character varying, 'gif'::character varying])::text[])))
);


--
-- Name: cursor_effects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cursor_effects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cursor_effects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cursor_effects_id_seq OWNED BY public.cursor_effects.id;


--
-- Name: follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follows (
    id integer NOT NULL,
    follower_id integer NOT NULL,
    following_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT follows_check CHECK ((follower_id <> following_id))
);


--
-- Name: follows_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.follows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: follows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.follows_id_seq OWNED BY public.follows.id;


--
-- Name: gallery_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gallery_images (
    id integer NOT NULL,
    url text NOT NULL,
    public_id text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    category text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    description text DEFAULT ''::text NOT NULL,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    width integer DEFAULT 0 NOT NULL,
    height integer DEFAULT 0 NOT NULL,
    likes integer DEFAULT 0 NOT NULL,
    is_featured boolean DEFAULT false NOT NULL
);


--
-- Name: gallery_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gallery_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gallery_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.gallery_images_id_seq OWNED BY public.gallery_images.id;


--
-- Name: github_trending; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.github_trending (
    id integer NOT NULL,
    repo_name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    description text,
    html_url character varying(500) NOT NULL,
    stars integer DEFAULT 0,
    forks integer DEFAULT 0,
    language character varying(100),
    owner_avatar character varying(500),
    topics text[] DEFAULT '{}'::text[],
    period character varying(20) NOT NULL,
    stars_gained integer DEFAULT 0,
    rank integer DEFAULT 0,
    crawled_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    crawled_date date DEFAULT CURRENT_DATE
);


--
-- Name: github_trending_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.github_trending_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: github_trending_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.github_trending_id_seq OWNED BY public.github_trending.id;


--
-- Name: hero_slides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hero_slides (
    id integer NOT NULL,
    img text NOT NULL,
    title text NOT NULL,
    subtitle text NOT NULL,
    sort_order integer,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hero_slides_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hero_slides_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hero_slides_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hero_slides_id_seq OWNED BY public.hero_slides.id;


--
-- Name: learn_editions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learn_editions (
    post_id integer NOT NULL,
    edition_date date NOT NULL,
    topic text NOT NULL,
    document jsonb NOT NULL,
    status text DEFAULT 'published'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learn_editions_status_check CHECK ((status = 'published'::text)),
    CONSTRAINT learn_editions_topic_check CHECK ((topic = ANY (ARRAY['agent'::text, 'rag'::text, 'engineering'::text, 'multimodal'::text])))
);


--
-- Name: newsletter_subscribers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_subscribers (
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer NOT NULL,
    type character varying(30) DEFAULT 'system'::character varying NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    link character varying(500),
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: point_read_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.point_read_log (
    user_id integer NOT NULL,
    post_slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: point_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.point_transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    amount integer NOT NULL,
    reason character varying(50) NOT NULL,
    ref_slug text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: point_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.point_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: point_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.point_transactions_id_seq OWNED BY public.point_transactions.id;


--
-- Name: post_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_attachments (
    id integer NOT NULL,
    post_slug text,
    url text NOT NULL,
    public_id text NOT NULL,
    filename text NOT NULL,
    size integer NOT NULL,
    mime_type text DEFAULT 'application/pdf'::text NOT NULL,
    uploaded_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: post_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.post_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: post_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.post_attachments_id_seq OWNED BY public.post_attachments.id;


--
-- Name: post_edit_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_edit_requests (
    id integer NOT NULL,
    post_slug text NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    excerpt text DEFAULT ''::text NOT NULL,
    content text NOT NULL,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    cover_image text,
    status text DEFAULT 'pending'::text NOT NULL,
    admin_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp with time zone
);


--
-- Name: post_edit_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.post_edit_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: post_edit_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.post_edit_requests_id_seq OWNED BY public.post_edit_requests.id;


--
-- Name: post_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_images (
    id integer NOT NULL,
    post_slug text,
    url text NOT NULL,
    public_id text NOT NULL,
    filename text NOT NULL,
    size integer NOT NULL,
    mime_type text NOT NULL,
    uploaded_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: post_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.post_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: post_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.post_images_id_seq OWNED BY public.post_images.id;


--
-- Name: post_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_reactions (
    id integer NOT NULL,
    post_slug text NOT NULL,
    user_id integer NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT post_reactions_type_check CHECK ((type = ANY (ARRAY['like'::text, 'dislike'::text])))
);


--
-- Name: post_reactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.post_reactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: post_reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.post_reactions_id_seq OWNED BY public.post_reactions.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    slug character varying(255) NOT NULL,
    title character varying(500) NOT NULL,
    excerpt text DEFAULT ''::text NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    view_count integer DEFAULT 0,
    cover_image text,
    author_id integer,
    attachments jsonb DEFAULT '[]'::jsonb NOT NULL
);


--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    tagline character varying(255),
    description text,
    cover_image character varying(500),
    cover_public_id character varying(255),
    tech_stack text[] DEFAULT '{}'::text[],
    highlights text[] DEFAULT '{}'::text[],
    demo_url character varying(500),
    github_url character varying(500),
    year character varying(20),
    sort_order integer DEFAULT 0,
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    content text,
    attachments jsonb DEFAULT '[]'::jsonb NOT NULL
);


--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: research_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.research_reports (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    topic text NOT NULL,
    model character varying(100) DEFAULT ''::character varying NOT NULL,
    language character varying(50) DEFAULT '中文'::character varying NOT NULL,
    status character varying(50) DEFAULT 'finished'::character varying NOT NULL,
    report_content text DEFAULT ''::text NOT NULL,
    elapsed_seconds integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: research_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.research_reports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: research_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.research_reports_id_seq OWNED BY public.research_reports.id;


--
-- Name: skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skills (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    content text,
    source_url character varying(500) NOT NULL,
    source_type character varying(20) DEFAULT 'github'::character varying NOT NULL,
    stars integer DEFAULT 0,
    tags text[] DEFAULT '{}'::text[],
    category character varying(50) DEFAULT 'other'::character varying,
    cover_image character varying(500),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    chinese_summary text
);


--
-- Name: skills_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skills_id_seq OWNED BY public.skills.id;


--
-- Name: user_cursor_effects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_cursor_effects (
    id integer NOT NULL,
    user_id integer NOT NULL,
    effect_id integer NOT NULL,
    purchased_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_cursor_effects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_cursor_effects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_cursor_effects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_cursor_effects_id_seq OWNED BY public.user_cursor_effects.id;


--
-- Name: user_frames; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_frames (
    id integer NOT NULL,
    user_id integer NOT NULL,
    frame_id integer NOT NULL,
    purchased_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_frames_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_frames_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_frames_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_frames_id_seq OWNED BY public.user_frames.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    password text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    verified boolean DEFAULT false NOT NULL,
    verify_token text,
    token_expires timestamp with time zone,
    phone text,
    bio text,
    avatar text,
    role text DEFAULT 'user'::text NOT NULL,
    location character varying(100),
    website text,
    github_url text,
    twitter_url text,
    motto character varying(100),
    tech_stack text[] DEFAULT '{}'::text[] NOT NULL,
    title character varying(100),
    equipped_frame integer,
    points integer DEFAULT 0 NOT NULL,
    equipped_cursor_effect integer
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: visitor_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visitor_tracking (
    id integer NOT NULL,
    visitor_id character varying(64) NOT NULL,
    session_id character varying(64) NOT NULL,
    path character varying(500) NOT NULL,
    referrer character varying(500),
    user_agent character varying(500),
    ip_hash character varying(64),
    country character varying(64),
    is_logged_in boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: visitor_tracking_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visitor_tracking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visitor_tracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visitor_tracking_id_seq OWNED BY public.visitor_tracking.id;


--
-- Name: avatar_frames id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avatar_frames ALTER COLUMN id SET DEFAULT nextval('public.avatar_frames_id_seq'::regclass);


--
-- Name: bookmarks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookmarks ALTER COLUMN id SET DEFAULT nextval('public.bookmarks_id_seq'::regclass);


--
-- Name: comment_likes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes ALTER COLUMN id SET DEFAULT nextval('public.comment_likes_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: cursor_effects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cursor_effects ALTER COLUMN id SET DEFAULT nextval('public.cursor_effects_id_seq'::regclass);


--
-- Name: follows id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows ALTER COLUMN id SET DEFAULT nextval('public.follows_id_seq'::regclass);


--
-- Name: gallery_images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_images ALTER COLUMN id SET DEFAULT nextval('public.gallery_images_id_seq'::regclass);


--
-- Name: github_trending id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.github_trending ALTER COLUMN id SET DEFAULT nextval('public.github_trending_id_seq'::regclass);


--
-- Name: hero_slides id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hero_slides ALTER COLUMN id SET DEFAULT nextval('public.hero_slides_id_seq'::regclass);


--
-- Name: point_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_transactions ALTER COLUMN id SET DEFAULT nextval('public.point_transactions_id_seq'::regclass);


--
-- Name: post_attachments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_attachments ALTER COLUMN id SET DEFAULT nextval('public.post_attachments_id_seq'::regclass);


--
-- Name: post_edit_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_edit_requests ALTER COLUMN id SET DEFAULT nextval('public.post_edit_requests_id_seq'::regclass);


--
-- Name: post_images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_images ALTER COLUMN id SET DEFAULT nextval('public.post_images_id_seq'::regclass);


--
-- Name: post_reactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_reactions ALTER COLUMN id SET DEFAULT nextval('public.post_reactions_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: research_reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_reports ALTER COLUMN id SET DEFAULT nextval('public.research_reports_id_seq'::regclass);


--
-- Name: skills id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills ALTER COLUMN id SET DEFAULT nextval('public.skills_id_seq'::regclass);


--
-- Name: user_cursor_effects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_cursor_effects ALTER COLUMN id SET DEFAULT nextval('public.user_cursor_effects_id_seq'::regclass);


--
-- Name: user_frames id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_frames ALTER COLUMN id SET DEFAULT nextval('public.user_frames_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: visitor_tracking id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitor_tracking ALTER COLUMN id SET DEFAULT nextval('public.visitor_tracking_id_seq'::regclass);


--
-- Name: auth_rate_limits auth_rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_rate_limits
    ADD CONSTRAINT auth_rate_limits_pkey PRIMARY KEY (scope, subject_hash);


--
-- Name: avatar_frames avatar_frames_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avatar_frames
    ADD CONSTRAINT avatar_frames_key_key UNIQUE (key);


--
-- Name: avatar_frames avatar_frames_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avatar_frames
    ADD CONSTRAINT avatar_frames_pkey PRIMARY KEY (id);


--
-- Name: bookmarks bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_pkey PRIMARY KEY (id);


--
-- Name: bookmarks bookmarks_post_slug_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_post_slug_user_id_key UNIQUE (post_slug, user_id);


--
-- Name: comment_likes comment_likes_comment_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_user_id_key UNIQUE (comment_id, user_id);


--
-- Name: comment_likes comment_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: cursor_effects cursor_effects_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cursor_effects
    ADD CONSTRAINT cursor_effects_key_key UNIQUE (key);


--
-- Name: cursor_effects cursor_effects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cursor_effects
    ADD CONSTRAINT cursor_effects_pkey PRIMARY KEY (id);


--
-- Name: follows follows_follower_id_following_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_following_id_key UNIQUE (follower_id, following_id);


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (id);


--
-- Name: gallery_images gallery_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_images
    ADD CONSTRAINT gallery_images_pkey PRIMARY KEY (id);


--
-- Name: github_trending github_trending_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.github_trending
    ADD CONSTRAINT github_trending_pkey PRIMARY KEY (id);


--
-- Name: hero_slides hero_slides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hero_slides
    ADD CONSTRAINT hero_slides_pkey PRIMARY KEY (id);


--
-- Name: learn_editions learn_editions_edition_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learn_editions
    ADD CONSTRAINT learn_editions_edition_date_key UNIQUE (edition_date);


--
-- Name: learn_editions learn_editions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learn_editions
    ADD CONSTRAINT learn_editions_pkey PRIMARY KEY (post_id);


--
-- Name: newsletter_subscribers newsletter_subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (email);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: point_read_log point_read_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_read_log
    ADD CONSTRAINT point_read_log_pkey PRIMARY KEY (user_id, post_slug);


--
-- Name: point_transactions point_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_transactions
    ADD CONSTRAINT point_transactions_pkey PRIMARY KEY (id);


--
-- Name: post_attachments post_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_attachments
    ADD CONSTRAINT post_attachments_pkey PRIMARY KEY (id);


--
-- Name: post_edit_requests post_edit_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_edit_requests
    ADD CONSTRAINT post_edit_requests_pkey PRIMARY KEY (id);


--
-- Name: post_images post_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_images
    ADD CONSTRAINT post_images_pkey PRIMARY KEY (id);


--
-- Name: post_images post_images_public_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_images
    ADD CONSTRAINT post_images_public_id_key UNIQUE (public_id);


--
-- Name: post_reactions post_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_reactions
    ADD CONSTRAINT post_reactions_pkey PRIMARY KEY (id);


--
-- Name: post_reactions post_reactions_post_slug_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_reactions
    ADD CONSTRAINT post_reactions_post_slug_user_id_key UNIQUE (post_slug, user_id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: posts posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_slug_key UNIQUE (slug);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: projects projects_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_slug_key UNIQUE (slug);


--
-- Name: research_reports research_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_reports
    ADD CONSTRAINT research_reports_pkey PRIMARY KEY (id);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);


--
-- Name: skills skills_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_slug_key UNIQUE (slug);


--
-- Name: skills skills_source_url_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_source_url_key UNIQUE (source_url);


--
-- Name: user_cursor_effects user_cursor_effects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_cursor_effects
    ADD CONSTRAINT user_cursor_effects_pkey PRIMARY KEY (id);


--
-- Name: user_cursor_effects user_cursor_effects_user_id_effect_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_cursor_effects
    ADD CONSTRAINT user_cursor_effects_user_id_effect_id_key UNIQUE (user_id, effect_id);


--
-- Name: user_frames user_frames_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_frames
    ADD CONSTRAINT user_frames_pkey PRIMARY KEY (id);


--
-- Name: user_frames user_frames_user_id_frame_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_frames
    ADD CONSTRAINT user_frames_user_id_frame_id_key UNIQUE (user_id, frame_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: visitor_tracking visitor_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitor_tracking
    ADD CONSTRAINT visitor_tracking_pkey PRIMARY KEY (id);


--
-- Name: auth_rate_limits_window_start_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_rate_limits_window_start_idx ON public.auth_rate_limits USING btree (window_started_at);


--
-- Name: comments_post_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comments_post_slug_idx ON public.comments USING btree (post_slug);


--
-- Name: comments_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comments_status_idx ON public.comments USING btree (status);


--
-- Name: idx_bookmarks_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookmarks_user ON public.bookmarks USING btree (user_id);


--
-- Name: idx_comment_likes_comment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes USING btree (comment_id);


--
-- Name: idx_comment_likes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comment_likes_user_id ON public.comment_likes USING btree (user_id);


--
-- Name: idx_comments_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_parent ON public.comments USING btree (parent_id);


--
-- Name: idx_comments_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_parent_id ON public.comments USING btree (parent_id);


--
-- Name: idx_comments_post_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_post_slug ON public.comments USING btree (post_slug);


--
-- Name: idx_edit_requests_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_edit_requests_slug ON public.post_edit_requests USING btree (post_slug);


--
-- Name: idx_edit_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_edit_requests_status ON public.post_edit_requests USING btree (status);


--
-- Name: idx_edit_requests_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_edit_requests_user ON public.post_edit_requests USING btree (user_id);


--
-- Name: idx_follows_follower; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_follows_follower ON public.follows USING btree (follower_id);


--
-- Name: idx_follows_following; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_follows_following ON public.follows USING btree (following_id);


--
-- Name: idx_gallery_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gallery_tags ON public.gallery_images USING gin (tags);


--
-- Name: idx_notifications_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_created ON public.notifications USING btree (user_id, created_at DESC);


--
-- Name: idx_notifications_user_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, is_read) WHERE (is_read = false);


--
-- Name: idx_point_tx_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_point_tx_user ON public.point_transactions USING btree (user_id, created_at DESC);


--
-- Name: idx_post_images_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_images_slug ON public.post_images USING btree (post_slug);


--
-- Name: idx_post_images_uploader; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_images_uploader ON public.post_images USING btree (uploaded_by);


--
-- Name: idx_posts_published_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_published_created ON public.posts USING btree (published, created_at DESC);


--
-- Name: idx_posts_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_slug ON public.posts USING btree (slug);


--
-- Name: idx_projects_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_enabled ON public.projects USING btree (enabled);


--
-- Name: idx_projects_sort_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_sort_order ON public.projects USING btree (sort_order);


--
-- Name: idx_reactions_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reactions_slug ON public.post_reactions USING btree (post_slug);


--
-- Name: idx_research_reports_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_research_reports_created_at ON public.research_reports USING btree (created_at DESC);


--
-- Name: idx_research_reports_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_research_reports_user_id ON public.research_reports USING btree (user_id);


--
-- Name: idx_skills_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_skills_category ON public.skills USING btree (category);


--
-- Name: idx_skills_source_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_skills_source_type ON public.skills USING btree (source_type);


--
-- Name: idx_skills_stars; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_skills_stars ON public.skills USING btree (stars DESC);


--
-- Name: idx_skills_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_skills_updated ON public.skills USING btree (updated_at DESC);


--
-- Name: idx_trending_period_crawled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trending_period_crawled ON public.github_trending USING btree (period, crawled_at DESC);


--
-- Name: idx_trending_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trending_slug ON public.github_trending USING btree (slug);


--
-- Name: idx_trending_stars; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trending_stars ON public.github_trending USING btree (stars DESC);


--
-- Name: idx_trending_stars_gained; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trending_stars_gained ON public.github_trending USING btree (stars_gained DESC);


--
-- Name: idx_trending_unique_daily; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_trending_unique_daily ON public.github_trending USING btree (repo_name, period, crawled_date);


--
-- Name: idx_user_cursor_effects_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_cursor_effects_user ON public.user_cursor_effects USING btree (user_id);


--
-- Name: idx_user_frames_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_frames_user ON public.user_frames USING btree (user_id);


--
-- Name: idx_visitor_tracking_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visitor_tracking_created_at ON public.visitor_tracking USING btree (created_at DESC);


--
-- Name: idx_visitor_tracking_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visitor_tracking_path ON public.visitor_tracking USING btree (path);


--
-- Name: idx_visitor_tracking_referrer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visitor_tracking_referrer ON public.visitor_tracking USING btree (referrer);


--
-- Name: idx_visitor_tracking_visitor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visitor_tracking_visitor_id ON public.visitor_tracking USING btree (visitor_id);


--
-- Name: learn_editions_topic_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learn_editions_topic_date ON public.learn_editions USING btree (topic, edition_date DESC);


--
-- Name: bookmarks bookmarks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comment_likes comment_likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comment_likes comment_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comments comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: follows follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: follows follows_following_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: learn_editions learn_editions_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learn_editions
    ADD CONSTRAINT learn_editions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: point_transactions point_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_transactions
    ADD CONSTRAINT point_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: post_edit_requests post_edit_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_edit_requests
    ADD CONSTRAINT post_edit_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: post_images post_images_post_slug_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_images
    ADD CONSTRAINT post_images_post_slug_fkey FOREIGN KEY (post_slug) REFERENCES public.posts(slug) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: post_images post_images_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_images
    ADD CONSTRAINT post_images_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: post_reactions post_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_reactions
    ADD CONSTRAINT post_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: posts posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: research_reports research_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.research_reports
    ADD CONSTRAINT research_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_cursor_effects user_cursor_effects_effect_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_cursor_effects
    ADD CONSTRAINT user_cursor_effects_effect_id_fkey FOREIGN KEY (effect_id) REFERENCES public.cursor_effects(id) ON DELETE CASCADE;


--
-- Name: user_cursor_effects user_cursor_effects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_cursor_effects
    ADD CONSTRAINT user_cursor_effects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_frames user_frames_frame_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_frames
    ADD CONSTRAINT user_frames_frame_id_fkey FOREIGN KEY (frame_id) REFERENCES public.avatar_frames(id) ON DELETE CASCADE;


--
-- Name: user_frames user_frames_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_frames
    ADD CONSTRAINT user_frames_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_equipped_cursor_effect_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_equipped_cursor_effect_fkey FOREIGN KEY (equipped_cursor_effect) REFERENCES public.cursor_effects(id) ON DELETE SET NULL;


--
-- Name: users users_equipped_frame_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_equipped_frame_fkey FOREIGN KEY (equipped_frame) REFERENCES public.avatar_frames(id) ON DELETE SET NULL;


--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications notifications_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notifications_delete_own ON public.notifications FOR DELETE USING (true);


--
-- Name: notifications notifications_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notifications_insert_own ON public.notifications FOR INSERT WITH CHECK (true);


--
-- Name: notifications notifications_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notifications_select_own ON public.notifications FOR SELECT USING (true);


--
-- Name: notifications notifications_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: research_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.research_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: visitor_tracking; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.visitor_tracking ENABLE ROW LEVEL SECURITY;

--
-- Name: visitor_tracking visitor_tracking_insert_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY visitor_tracking_insert_all ON public.visitor_tracking FOR INSERT WITH CHECK (true);


--
-- Name: visitor_tracking visitor_tracking_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY visitor_tracking_select_all ON public.visitor_tracking FOR SELECT USING (true);


--
-- PostgreSQL database dump complete
--

\unrestrict Q4Gps8qOjmxlZJO3zpjOemflQQwnO0imX4DadVa2X4fBY6pvxeARALSMSsbQ9o1
