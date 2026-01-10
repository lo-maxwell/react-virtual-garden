ALTER TABLE gooses
ADD COLUMN status TEXT NOT NULL DEFAULT 'active',
ADD COLUMN sold_at TIMESTAMP NULL,
ADD COLUMN sold_price INTEGER NULL;


ALTER TABLE gooses
ADD CONSTRAINT gooses_status_check
CHECK (status IN ('active', 'sold'));

-- ALTER TABLE gooses
-- DROP CONSTRAINT gooses_status_check;

-- ALTER TABLE gooses
-- ADD CONSTRAINT gooses_status_check
-- CHECK (status IN ('active', 'sold', 'retired'));