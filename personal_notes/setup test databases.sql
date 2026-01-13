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
CREATE TABLE IF NOT EXISTS users (
	id VARCHAR(28) PRIMARY KEY,  -- No default
	username VARCHAR(255) NOT NULL, -- Username (string)
	password_hash TEXT NOT NULL,    -- Password hash (string)
	password_salt TEXT NOT NULL,    -- Password salt (string)
	icon VARCHAR(50)               -- Icon reference (can be a foreign key if linked to another table)
);


--Inventories
CREATE TABLE IF NOT EXISTS inventories (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
	owner VARCHAR(28) NOT NULL,         -- User ID (foreign key from the 'users' table)
	gold INTEGER NOT NULL CHECK (gold >= 0),       -- Inventory's gold
	FOREIGN KEY (owner) REFERENCES users(id) -- Establishing relationship with 'users' table
);

--Stores
CREATE TABLE IF NOT EXISTS stores (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
	owner VARCHAR(28) NOT NULL,         -- User ID (foreign key from the 'users' table)
	identifier INTEGER NOT NULL DEFAULT 0, -- Indexes into list of possible stores for data fields
	last_restock_time_ms BIGINT NOT NULL DEFAULT 0, -- Last restock in milliseconds since epoch time
	FOREIGN KEY (owner) REFERENCES users(id) -- Establishing relationship with 'users' table
);

--Levels
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
CREATE UNIQUE INDEX IF NOT EXISTS levels_owner_uuid_unique ON levels (owner_uuid, owner_type)
WHERE owner_uuid IS NOT NULL;

-- Partial unique index for UID-based owners
CREATE UNIQUE INDEX IF NOT EXISTS levels_owner_uid_unique ON levels (owner_uid, owner_type)
WHERE owner_uid IS NOT NULL;

--Inventory items
CREATE TABLE IF NOT EXISTS inventory_items (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
	owner UUID NOT NULL,            -- Inventory ID (foreign key from the 'inventories' table)
	identifier CHAR(13) NOT NULL,      -- Template reference (could be a foreign key if related to another table)
	quantity INTEGER NOT NULL CHECK (quantity >= 0), 		   -- Quantity
	FOREIGN KEY (owner) REFERENCES inventories(id),  -- Establishing relationship with 'inventories' table
	UNIQUE (owner, identifier)
);


--Store items
CREATE TABLE IF NOT EXISTS store_items (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
	owner UUID NOT NULL,            -- Inventory ID (foreign key from the 'stores' table)
	identifier CHAR(13) NOT NULL,      -- Template reference (could be a foreign key if related to another table)
	quantity INTEGER NOT NULL CHECK (quantity >= 0), 		   -- Quantity
	FOREIGN KEY (owner) REFERENCES stores(id),  -- Establishing relationship with 'stores' table
	UNIQUE (owner, identifier)
);

--Gardens
CREATE TABLE IF NOT EXISTS gardens (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
	owner VARCHAR(28) NOT NULL,         -- User ID (foreign key from the 'users' table)
	rows INTEGER NOT NULL CHECK (rows >= 1 AND rows <= 20),            -- Number of rows in garden (1 to 20)
	columns INTEGER NOT NULL CHECK (columns >= 1 AND columns <= 20),         -- Number of columns in garden (1 to 20)
	FOREIGN KEY (owner) REFERENCES users(id) -- Establishing relationship with 'users' table
);

--Plots
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

--Placed items
CREATE TABLE IF NOT EXISTS placed_items (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
	owner UUID NOT NULL,            -- Plot ID (foreign key from the 'plots' table)
	identifier CHAR(13) NOT NULL,      -- Template reference (could be a foreign key if related to another table)
	status TEXT, 		   -- Status String
	FOREIGN KEY (owner) REFERENCES plots(id),  -- Establishing relationship with 'plots' table
	UNIQUE (owner)
);


--Item Details (for items that need flexible JSON storage, including eggs)
-- Can reference a placed item, an inventory item, or both (allowing same details to be shared)
-- Details row is only deleted when both placed_item_id and inventory_item_id are NULL
CREATE TABLE IF NOT EXISTS item_details (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
	placed_item_id UUID,            -- Placed item ID (foreign key from 'placed_items' table) - for PlacedEgg
	inventory_item_id UUID,          -- Inventory item ID (foreign key from 'inventory_items' table) - for InventoryEgg
	details JSONB NOT NULL,  --json object containing item details, ie. for eggs: {parent1: 'goose-1', parent2: 'goose-2', laidAt: 1234567890, hatchAt: 1234567890, isFertilized: true}
	FOREIGN KEY (placed_item_id) REFERENCES placed_items(id) ON DELETE SET NULL,  -- Set to NULL when placed_item is deleted
	FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE SET NULL,  -- Set to NULL when inventory_item is deleted
	CHECK (placed_item_id IS NOT NULL OR inventory_item_id IS NOT NULL)  -- Ensure at least one reference is set initially
);
-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_item_details_placed_item ON item_details(placed_item_id) WHERE placed_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_item_details_inventory_item ON item_details(inventory_item_id) WHERE inventory_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_item_details_jsonb ON item_details USING GIN (details);

--Action Histories
CREATE TABLE IF NOT EXISTS action_histories (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
	owner VARCHAR(28) NOT NULL,            -- User Id (foreign key from the 'users' table)
	identifier VARCHAR(255) NOT NULL,      -- Indexes into actionhistories data, ie. "plant:all:harvested"
	quantity INTEGER NOT NULL CHECK (quantity >= 0), -- Number this history tracks
	FOREIGN KEY (owner) REFERENCES users(id),  -- Establishing relationship with 'users' table
	UNIQUE (owner, identifier)
);

--Item Histories
CREATE TABLE IF NOT EXISTS item_histories (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
	owner VARCHAR(28) NOT NULL,            -- User Id (foreign key from the 'users' table)
	identifier CHAR(13) NOT NULL,      -- item template reference
	quantity INTEGER NOT NULL CHECK (quantity >= 0), -- Number this history tracks
	FOREIGN KEY (owner) REFERENCES users(id),  -- Establishing relationship with 'users' table
	UNIQUE (owner, identifier)
);


--Toolboxes
CREATE TABLE IF NOT EXISTS toolboxes (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
	owner VARCHAR(28) NOT NULL,         -- User ID (foreign key from the 'users' table)
	FOREIGN KEY (owner) REFERENCES users(id) -- Establishing relationship with 'users' table
);

--Tools
CREATE TABLE IF NOT EXISTS tools (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
	owner UUID NOT NULL,            -- Inventory ID (foreign key from the 'toolboxes' table)
	identifier CHAR(13) NOT NULL,      -- Template reference (could be a foreign key if related to another table)
	FOREIGN KEY (owner) REFERENCES toolboxes(id),  -- Establishing relationship with 'toolboxes' table
	UNIQUE (owner, identifier)
);

--User Events
CREATE TABLE IF NOT EXISTS user_events (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	owner VARCHAR(28) NOT NULL,
	event_type VARCHAR(255) NOT NULL,
	streak INT DEFAULT 0,
	created_at TIMESTAMPTZ DEFAULT now(),
	FOREIGN KEY (owner) REFERENCES users(id)
);

--Event Rewards
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

--Event Reward Items
CREATE TABLE IF NOT EXISTS event_reward_items (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
	owner UUID NOT NULL,            -- event reward id (foreign key from the 'event_rewards' table)
	identifier CHAR(13) NOT NULL,      -- Template reference (could be a foreign key if related to another table)
	quantity INTEGER NOT NULL CHECK (quantity >= 0), 		   -- Quantity
	FOREIGN KEY (owner) REFERENCES event_rewards(id),  -- Establishing relationship with 'event_rewards' table
	UNIQUE (owner, identifier)
);

--Goose Pen
CREATE TABLE IF NOT EXISTS goose_pens (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Generate a UUID by default
	owner VARCHAR(28) NOT NULL,            -- event reward id (foreign key from the 'users' table)
	size INT NOT NULL CHECK (size >= 0),  -- pen size
	FOREIGN KEY (owner) REFERENCES users(id)  -- Establishing relationship with 'users' table
);

--Goose
CREATE TABLE IF NOT EXISTS gooses (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	owner UUID NOT NULL REFERENCES goose_pens(id),
	name VARCHAR(256) NOT NULL,
	color CHAR(6) NOT NULL,
	birthday TIMESTAMPTZ NOT NULL DEFAULT now(),
	attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
	status TEXT NOT NULL DEFAULT 'active',
	sold_at TIMESTAMPTZ NULL,
	sold_price INTEGER NULL,

	CONSTRAINT gooses_status_check
		CHECK (status IN ('active', 'sold'))
);

CREATE INDEX IF NOT EXISTS gooses_attributes_idx ON gooses USING GIN (attributes);
CREATE INDEX IF NOT EXISTS gooses_owner_active_idx
ON gooses (owner)
WHERE status = 'active';

--Announcements
CREATE TABLE IF NOT EXISTS announcements (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	display_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	expires_at TIMESTAMPTZ,
	header TEXT NOT NULL,
	icon TEXT NOT NULL,
	body TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_display_at ON announcements (display_at DESC);

CREATE TABLE IF NOT EXISTS user_announcement_reads (
  user_id VARCHAR(28) NOT NULL REFERENCES users(id),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, announcement_id)
);
