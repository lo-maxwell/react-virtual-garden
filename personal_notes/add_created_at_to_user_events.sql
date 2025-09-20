-- Add the created_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_events'
          AND column_name = 'created_at'
    ) THEN
        ALTER TABLE user_events
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

        -- Optionally, update existing rows with a timestamp if they were null
        -- This might not be necessary if DEFAULT CURRENT_TIMESTAMP handles it for new rows immediately
        -- and existing rows are already set to a default based on the table creation timestamp.
        -- UPDATE user_events SET created_at = now() WHERE created_at IS NULL;
    END IF;
END $$; 