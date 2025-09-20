-- Enable the uuid-ossp extension (requires superuser privileges)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--Icons
-- Use a DO block for procedural execution
DO $$
DECLARE
    table_created BOOLEAN := FALSE;  -- Flag to track if the table was newly created
BEGIN
    -- Check if the table exists in the current schema
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'icons'
    ) THEN
		CREATE TABLE IF NOT EXISTS icons (
			id SERIAL PRIMARY KEY,
			name VARCHAR(50),
			icon CHAR(1),
			UNIQUE (name)	
		);
		table_created := TRUE;
	END IF;
	 -- Insert rows only if the table was newly created
    IF table_created THEN
		INSERT INTO icons (name, icon) VALUES
			('error', '❌'),
			('mango', '🥭'),
			('construction sign', '🚧'),
			('flamingo', '🦩');
	END IF;
END $$;

--Users
-- Use a DO block for procedural execution
DO $$
DECLARE
    table_created BOOLEAN := FALSE;  -- Flag to track if the table was newly created
BEGIN
    -- Check if the table exists in the current schema
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) THEN
		CREATE TABLE IF NOT EXISTS users (
			id VARCHAR(28) PRIMARY KEY,  -- No default
			username VARCHAR(255) NOT NULL, -- Username (string)
			password_hash TEXT NOT NULL,    -- Password hash (string)
			password_salt TEXT NOT NULL,    -- Password salt (string)
			icon VARCHAR(50)               -- Icon reference (can be a foreign key if linked to another table)
		);
		table_created := TRUE;
	END IF;
END $$;


--Inventories
-- Use a DO block for procedural execution
DO $$
DECLARE
    table_created BOOLEAN := FALSE;  -- Flag to track if the table was newly created
BEGIN
    -- Check if the table exists in the current schema
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'inventories'
    ) THEN
		CREATE TABLE IF NOT EXISTS inventories (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
			owner VARCHAR(28) NOT NULL,         -- User ID (foreign key from the 'users' table)
			gold INTEGER NOT NULL CHECK (gold >= 0),       -- Inventory's gold
			FOREIGN KEY (owner) REFERENCES users(id) -- Establishing relationship with 'users' table
		);
		table_created := TRUE;
	END IF;
END $$;

--Stores
-- Use a DO block for procedural execution
DO $$
DECLARE
    table_created BOOLEAN := FALSE;  -- Flag to track if the table was newly created
BEGIN
    -- Check if the table exists in the current schema
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'stores'
    ) THEN
		CREATE TABLE IF NOT EXISTS stores (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
			owner VARCHAR(28) NOT NULL,         -- User ID (foreign key from the 'users' table)
			identifier INTEGER NOT NULL DEFAULT 0, -- Indexes into list of possible stores for data fields
			last_restock_time_ms BIGINT NOT NULL DEFAULT 0, -- Last restock in milliseconds since epoch time
			FOREIGN KEY (owner) REFERENCES users(id) -- Establishing relationship with 'users' table
		);
		table_created := TRUE;
	END IF;
END $$;

--Levels
-- Use a DO block for procedural execution
DO $$
DECLARE
    table_created BOOLEAN := FALSE;  -- Flag to track if the table was newly created
BEGIN
    -- Check if the table exists in the current schema
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'levels'
    ) THEN
		CREATE TABLE IF NOT EXISTS levels (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
			owner_uuid UUID,                      -- Stores owner if UUID (e.g., for gardens or inventories)
			owner_uid VARCHAR(128),               -- Stores Firebase UID if user is the owner
			owner_type VARCHAR(50) NOT NULL,   -- Type of owner (ie. user, garden)
			total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0), -- Total XP (integer, defaulting to 0)
			growth_rate FLOAT NOT NULL DEFAULT 1.0, -- Growth rate (float, defaulting to 1.0)
			CHECK (owner_uuid IS NOT NULL OR owner_uid IS NOT NULL), -- Ensure one owner field is filled
    		CHECK (owner_uuid IS NULL OR owner_uid IS NULL)          -- Ensure only one owner field is filled
		);
		-- Partial unique index for UUID-based owners
		CREATE UNIQUE INDEX levels_owner_uuid_unique ON levels (owner_uuid, owner_type)
		WHERE owner_uuid IS NOT NULL;

		-- Partial unique index for UID-based owners
		CREATE UNIQUE INDEX levels_owner_uid_unique ON levels (owner_uid, owner_type)
		WHERE owner_uid IS NOT NULL;
		table_created := TRUE;
	END IF;
END $$;

--Inventory items
-- Use a DO block for procedural execution
DO $$
DECLARE
    table_created BOOLEAN := FALSE;  -- Flag to track if the table was newly created
BEGIN
    -- Check if the table exists in the current schema
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'inventory_items'
    ) THEN
		CREATE TABLE IF NOT EXISTS inventory_items (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
			owner UUID NOT NULL,            -- Inventory ID (foreign key from the 'inventories' table)
			identifier CHAR(13) NOT NULL,      -- Template reference (could be a foreign key if related to another table)
			quantity INTEGER NOT NULL CHECK (quantity >= 0), 		   -- Quantity
			FOREIGN KEY (owner) REFERENCES inventories(id),  -- Establishing relationship with 'inventories' table
			UNIQUE (owner, identifier)
		);
		table_created := TRUE;
	END IF;
END $$;


--Store items
-- Use a DO block for procedural execution
DO $$
DECLARE
    table_created BOOLEAN := FALSE;  -- Flag to track if the table was newly created
BEGIN
    -- Check if the table exists in the current schema
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'store_items'
    ) THEN
		CREATE TABLE IF NOT EXISTS store_items (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
			owner UUID NOT NULL,            -- Inventory ID (foreign key from the 'stores' table)
			identifier CHAR(13) NOT NULL,      -- Template reference (could be a foreign key if related to another table)
			quantity INTEGER NOT NULL CHECK (quantity >= 0), 		   -- Quantity
			FOREIGN KEY (owner) REFERENCES stores(id),  -- Establishing relationship with 'stores' table
			UNIQUE (owner, identifier)
		);
		table_created := TRUE;
	END IF;
END $$;

--Gardens
-- Use a DO block for procedural execution
DO $$
DECLARE
    table_created BOOLEAN := FALSE;  -- Flag to track if the table was newly created
BEGIN
    -- Check if the table exists in the current schema
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'gardens'
    ) THEN
		CREATE TABLE IF NOT EXISTS gardens (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
			owner VARCHAR(28) NOT NULL,         -- User ID (foreign key from the 'users' table)
			rows INTEGER NOT NULL CHECK (rows >= 1 AND rows <= 20),            -- Number of rows in garden (1 to 20)
			columns INTEGER NOT NULL CHECK (columns >= 1 AND columns <= 20),         -- Number of columns in garden (1 to 20)
			FOREIGN KEY (owner) REFERENCES users(id) -- Establishing relationship with 'users' table
		);
		table_created := TRUE;
	END IF;
END $$;

--Plots
-- Use a DO block for procedural execution
DO $$
DECLARE
    table_created BOOLEAN := FALSE;  -- Flag to track if the table was newly created
BEGIN
    -- Check if the table exists in the current schema
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'plots'
    ) THEN
		CREATE TABLE IF NOT EXISTS plots (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
			owner UUID NOT NULL,         -- User ID (foreign key from the 'gardens' table)
			row_index INTEGER NOT NULL CHECK (row_index >= 0 AND row_index <= 19),            -- Row index (0 to 19)
			col_index INTEGER NOT NULL CHECK (col_index >= 0 AND col_index <= 19),         -- Column index (0 to 19)
			plant_time BIGINT NOT NULL DEFAULT 0,       -- Time planted as ms since epoch time
			uses_remaining INTEGER NOT NULL DEFAULT 0,  -- Number of uses (usually harvests)
			random_seed INTEGER NOT NULL DEFAULT (FLOOR(RANDOM() * (2147483647 - 1 + 1))),  -- Random seed between 1 and max_int
    		FOREIGN KEY (owner) REFERENCES gardens(id), -- Establishing relationship with 'gardens' table
			UNIQUE (owner, row_index, col_index)  -- Only 1 plot per row/column slot in a garden
		);
		table_created := TRUE;
	END IF;
END $$;

--Placed items
-- Use a DO block for procedural execution
DO $$
DECLARE
    table_created BOOLEAN := FALSE;  -- Flag to track if the table was newly created
BEGIN
    -- Check if the table exists in the current schema
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'placed_items'
    ) THEN
		CREATE TABLE IF NOT EXISTS placed_items (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
			owner UUID NOT NULL,            -- Plot ID (foreign key from the 'plots' table)
			identifier CHAR(13) NOT NULL,      -- Template reference (could be a foreign key if related to another table)
			status TEXT, 		   -- Status String
			FOREIGN KEY (owner) REFERENCES plots(id),  -- Establishing relationship with 'plots' table
			UNIQUE (owner)
		);
		table_created := TRUE;
	END IF;
END $$;

--Action Histories
-- Use a DO block for procedural execution
DO $$
DECLARE
    table_created BOOLEAN := FALSE;  -- Flag to track if the table was newly created
BEGIN
    -- Check if the table exists in the current schema
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'action_histories'
    ) THEN
		CREATE TABLE IF NOT EXISTS action_histories (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
			owner VARCHAR(28) NOT NULL,            -- User Id (foreign key from the 'users' table)
			identifier VARCHAR(255) NOT NULL,      -- Indexes into actionhistories data, ie. "plant:all:harvested"
			quantity INTEGER NOT NULL CHECK (quantity >= 0), -- Number this history tracks
			FOREIGN KEY (owner) REFERENCES users(id),  -- Establishing relationship with 'users' table
			UNIQUE (owner, identifier)
		);
		table_created := TRUE;
	END IF;
END $$;

--Item Histories
-- Use a DO block for procedural execution
DO $$
DECLARE
    table_created BOOLEAN := FALSE;  -- Flag to track if the table was newly created
BEGIN
    -- Check if the table exists in the current schema
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'item_histories'
    ) THEN
		CREATE TABLE IF NOT EXISTS item_histories (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
			owner VARCHAR(28) NOT NULL,            -- User Id (foreign key from the 'users' table)
			identifier CHAR(13) NOT NULL,      -- item template reference
			quantity INTEGER NOT NULL CHECK (quantity >= 0), -- Number this history tracks
			FOREIGN KEY (owner) REFERENCES users(id),  -- Establishing relationship with 'users' table
			UNIQUE (owner, identifier)
		);
		table_created := TRUE;
	END IF;
END $$;


--Toolboxes
-- Use a DO block for procedural execution
DO $$
DECLARE
    table_created BOOLEAN := FALSE;  -- Flag to track if the table was newly created
BEGIN
    -- Check if the table exists in the current schema
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'toolboxes'
    ) THEN
		CREATE TABLE IF NOT EXISTS toolboxes (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
			owner VARCHAR(28) NOT NULL,         -- User ID (foreign key from the 'users' table)
			FOREIGN KEY (owner) REFERENCES users(id) -- Establishing relationship with 'users' table
		);
		table_created := TRUE;
	END IF;
END $$;

--Tools
-- Use a DO block for procedural execution
DO $$
DECLARE
    table_created BOOLEAN := FALSE;  -- Flag to track if the table was newly created
BEGIN
    -- Check if the table exists in the current schema
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'tools'
    ) THEN
		CREATE TABLE IF NOT EXISTS tools (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
			owner UUID NOT NULL,            -- Inventory ID (foreign key from the 'toolboxes' table)
			identifier CHAR(13) NOT NULL,      -- Template reference (could be a foreign key if related to another table)
			FOREIGN KEY (owner) REFERENCES toolboxes(id),  -- Establishing relationship with 'toolboxes' table
			UNIQUE (owner, identifier)
		);
		table_created := TRUE;
	END IF;
END $$;

--User Events
-- Use a DO block for procedural execution
DO $$
DECLARE
    table_exists BOOLEAN := FALSE;
    id_column_type TEXT;
    pk_constraint_name TEXT;
BEGIN
    -- Check if the user_events table exists
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_events'
    ) THEN
        -- If table does not exist, create it with UUID ID
        RAISE NOTICE 'user_events table does not exist, creating it...';
        CREATE TABLE user_events (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            owner VARCHAR(28) NOT NULL,
            event_type VARCHAR(255) NOT NULL,
            streak INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner) REFERENCES users(id)
        );
        RAISE NOTICE 'user_events table created.';
    END IF;
END $$;

-- Add/Remove columns for existing user_events table if needed during migration
DO $$
DECLARE
    table_exists BOOLEAN := FALSE;
    column_exists BOOLEAN := FALSE;
BEGIN
    -- Check if the user_events table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'user_events'
    ) INTO table_exists;

    IF table_exists THEN
        -- Remove last_occurrence if it exists
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'user_events'
              AND column_name = 'last_occurrence'
        ) INTO column_exists;

        IF column_exists THEN
            RAISE NOTICE 'Dropping last_occurrence column from user_events.';
            ALTER TABLE user_events DROP COLUMN last_occurrence;
        END IF;

        -- Add created_at if it doesn't exist (already handled if table is new, but for migration)
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'user_events'
              AND column_name = 'created_at'
        ) INTO column_exists;

        IF NOT column_exists THEN
            RAISE NOTICE 'Adding created_at column to user_events.';
            ALTER TABLE user_events ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;
    END IF;
END $$;

--Event Rewards
-- Use a DO block for procedural execution
DO $$
DECLARE
    table_created BOOLEAN := FALSE;  -- Flag to track if the table was newly created
BEGIN
    -- Check if the table exists in the current schema
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'event_rewards'
    ) THEN
		CREATE TABLE IF NOT EXISTS event_rewards (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
			owner UUID NOT NULL,            -- event id (foreign key from the 'user_events' table)
			inventory UUID,
			gold INT DEFAULT 0,
			message TEXT,
			FOREIGN KEY (owner) REFERENCES user_events(id),  -- Establishing relationship with 'user_events' table
			FOREIGN KEY (inventory) REFERENCES inventories(id), -- Establishing relationship with 'inventories' table
			UNIQUE (owner)
		);
		table_created := TRUE;
	END IF;
END $$;

--Event Reward Items
-- Use a DO block for procedural execution
DO $$
DECLARE
    table_created BOOLEAN := FALSE;  -- Flag to track if the table was newly created
BEGIN
    -- Check if the table exists in the current schema
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'event_reward_items'
    ) THEN
		CREATE TABLE IF NOT EXISTS event_reward_items (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
			owner UUID NOT NULL,            -- event reward id (foreign key from the 'event_rewards' table)
			identifier CHAR(13) NOT NULL,      -- Template reference (could be a foreign key if related to another table)
			quantity INTEGER NOT NULL CHECK (quantity >= 0), 		   -- Quantity
			FOREIGN KEY (owner) REFERENCES event_rewards(id),  -- Establishing relationship with 'event_rewards' table
			UNIQUE (owner, identifier)
		);
		table_created := TRUE;
	END IF;
END $$;