-- Remove the unique constraint on (owner, event_type) from user_events table
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the name of the unique constraint on (owner, event_type)
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.user_events'::regclass
      AND contype = 'u'
      AND conkey = (SELECT array_agg(attnum ORDER BY attnum) FROM pg_attribute WHERE attrelid = 'public.user_events'::regclass AND attname IN ('owner', 'event_type'));

    IF constraint_name IS NOT NULL THEN
        RAISE NOTICE 'Dropping unique constraint % from user_events table.', constraint_name;
        EXECUTE 'ALTER TABLE user_events DROP CONSTRAINT ' || constraint_name || ';';
    ELSE
        RAISE NOTICE 'Unique constraint on (owner, event_type) not found on user_events table.';
    END IF;
END $$; 