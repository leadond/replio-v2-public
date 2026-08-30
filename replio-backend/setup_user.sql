CREATE TABLE IF NOT EXISTS "user" (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    company_id VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

INSERT INTO "user" (id, email, hashed_password, full_name, is_active, is_superuser, company_id)
VALUES (
    'test-user-id',
    'admin@replio.local',
    '$2b$12$9/f9YjEHvKZ80eWvzIZ0ouvg3zSZwJK/BL9FG/DkGpTBglW4GAI.m',
    'Admin User',
    true,
    false,
    NULL
);
