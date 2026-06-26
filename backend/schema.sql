-- Farmers Connect — PostgreSQL Schema (Neon)
-- Run this once against your Neon database before starting the server.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ ACCOUNTS ============
-- account_type distinguishes individual farmers from organizations (NGOs, co-ops, agribusiness, gov bodies)
CREATE TYPE account_type AS ENUM ('individual', 'organization');

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(30) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    full_name       VARCHAR(120) NOT NULL,
    account_type    account_type NOT NULL DEFAULT 'individual',
    bio             TEXT DEFAULT '',
    avatar_url      TEXT DEFAULT '',
    cover_url       TEXT DEFAULT '',
    location        VARCHAR(150) DEFAULT '',
    -- organization-only fields (null for individuals)
    org_category    VARCHAR(80),         -- e.g. 'NGO', 'Cooperative', 'Government', 'Agribusiness'
    org_website     TEXT,
    is_verified     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE follows (
    follower_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id <> following_id)
);

-- ============ FEED (Instagram-like) ============
CREATE TABLE posts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    caption         TEXT DEFAULT '',
    media_urls      TEXT[] DEFAULT '{}',   -- images/video, supports carousel
    location        VARCHAR(150) DEFAULT '',
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE post_likes (
    post_id         UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
);

CREATE TABLE comments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id         UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    body            TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    body            TEXT NOT NULL,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,   -- recipient
    actor_id        UUID REFERENCES users(id) ON DELETE CASCADE,   -- who triggered it
    type            VARCHAR(30) NOT NULL,   -- 'like','comment','follow','order','course_enroll'
    entity_id       UUID,                   -- post_id / product_id / course_id etc
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============ MARKETPLACE ============
CREATE TYPE listing_status AS ENUM ('available', 'reserved', 'sold');

CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(150) NOT NULL,
    description     TEXT DEFAULT '',
    category        VARCHAR(80) NOT NULL,   -- e.g. 'Seeds','Livestock','Produce','Equipment','Fertilizer'
    price           NUMERIC(12,2) NOT NULL,
    currency        VARCHAR(10) DEFAULT 'KES',
    quantity        INTEGER DEFAULT 1,
    unit            VARCHAR(30) DEFAULT 'unit',  -- kg, bag, head, litre...
    location         VARCHAR(150) DEFAULT '',
    media_urls      TEXT[] DEFAULT '{}',
    status          listing_status DEFAULT 'available',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'declined', 'completed', 'cancelled');

CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID REFERENCES products(id) ON DELETE CASCADE,
    buyer_id        UUID REFERENCES users(id) ON DELETE CASCADE,
    seller_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    quantity        INTEGER NOT NULL DEFAULT 1,
    total_price     NUMERIC(12,2) NOT NULL,
    status          order_status DEFAULT 'pending',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============ EDUCATION ============
CREATE TABLE courses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id     UUID REFERENCES users(id) ON DELETE CASCADE,  -- must be an organization
    title           VARCHAR(180) NOT NULL,
    description     TEXT DEFAULT '',
    category        VARCHAR(80) DEFAULT 'General',  -- 'Soil Health','Irrigation','Livestock', etc
    cover_url       TEXT DEFAULT '',
    content_url     TEXT DEFAULT '',     -- video/pdf/article link
    is_published    BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE course_enrollments (
    course_id       UUID REFERENCES courses(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    progress        INTEGER DEFAULT 0,    -- percent 0-100
    enrolled_at     TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (course_id, user_id)
);

-- ============ INDEXES ============
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_messages_thread ON messages(sender_id, recipient_id);
