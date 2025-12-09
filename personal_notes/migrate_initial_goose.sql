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


-- Ensure uuid-ossp extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add geese until the specified pen reaches 10 geese total
DO $$
DECLARE
    target_pen UUID := '59998e97-2279-4a60-b6c1-2fdbaa8c8396';  -- <--- PUT YOUR PEN ID HERE
    current_count INT;
    needed INT;
    i INT;
    
    personalities TEXT[] := ARRAY[
        'friendly', 'aggressive', 'curious', 'shy', 'playful',
        'proud', 'lazy', 'mischievous', 'nervous', 'confident'
    ];
    personality TEXT;
    hexchars TEXT := '0123456789ABCDEF';
    color TEXT;
BEGIN
    -- Make sure pen exists
    IF NOT EXISTS (SELECT 1 FROM goose_pens WHERE id = target_pen) THEN
        RAISE EXCEPTION 'Goose pen % does not exist', target_pen;
    END IF;

    -- Count existing geese
    SELECT COUNT(*) INTO current_count
    FROM gooses
    WHERE owner = target_pen;

    needed := 10 - current_count;
    IF needed <= 0 THEN
        RAISE NOTICE 'Pen already has % geese; no geese added.', current_count;
        RETURN;
    END IF;

    RAISE NOTICE 'Pen currently has %, adding % geese...', current_count, needed;

    -- Loop to add missing geese
    FOR i IN 1..needed LOOP

        -- Random personality
        SELECT personalities[1 + floor(random() * array_length(personalities,1))::int]
        INTO personality;

        -- Random 6-char hex color
        color := '';
        FOR i IN 1..6 LOOP
            color := color || substr(hexchars, floor(random()*16)::int + 1, 1);
        END LOOP;

        -- Insert goose
        INSERT INTO gooses (id, owner, name, color, birthday, attributes)
        VALUES (
            uuid_generate_v4(),          -- id
            target_pen,                  -- owner
            'Goose #' || (current_count + i), -- name
            color,                       -- hex color
            CURRENT_TIMESTAMP,           -- birthday
            jsonb_build_object(
                'power',       floor(random()*50) + 51,
                'charisma',    floor(random()*50) + 51,
                'mood',        floor(random()*50) + 51,
                'location',    0,
                'personality', personality
            )
        );

    END LOOP;

    RAISE NOTICE 'Added % new geese. Pen now has 10.', needed;

END $$;
