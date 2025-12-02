-- Enable the uuid-ossp extension (requires superuser privileges)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a goose pen for each user if they don't already have one
INSERT INTO goose_pens (id, owner, size)
SELECT uuid_generate_v4(), u.id, 10
FROM users u
WHERE NOT EXISTS (
    SELECT 1 
    FROM goose_pens g
    WHERE g.owner = u.id
);