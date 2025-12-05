-- Ensure uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add one goose to every goose pen that currently has zero geese
DO $$
DECLARE
    pen RECORD;
BEGIN
    FOR pen IN
        SELECT gp.id AS pen_id
        FROM goose_pens gp
        LEFT JOIN gooses g ON g.owner = gp.id
        GROUP BY gp.id
        HAVING COUNT(g.id) = 0
    LOOP
        INSERT INTO gooses (id, owner, name, color, birthday, attributes)
        VALUES (
            uuid_generate_v4(),          -- goose ID
            pen.pen_id,                  -- owner (pen ID)
            'Honky',                     -- default name
            'FFFFFF',                    -- default color
            CURRENT_TIMESTAMP,           -- birthday
            jsonb_build_object(
                'power',      FLOOR(RANDOM() * 50) + 51,
                'charisma',   FLOOR(RANDOM() * 50) + 51,
                'mood',       FLOOR(RANDOM() * 50) + 51,
                'personality','friendly',
                'location',   0
            )
        );
    END LOOP;
END $$;
