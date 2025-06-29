-- 1. Create a toolbox for each user if they don't already have one
INSERT INTO toolboxes (id, owner)
SELECT uuid_generate_v4(), u.id
FROM users u
LEFT JOIN toolboxes t ON t.owner = u.id
WHERE t.id IS NULL;

-- 2. Create a tool for each toolbox with the specified identifier if it doesn't already exist
INSERT INTO tools (id, owner, identifier)
SELECT uuid_generate_v4(), tb.id, '2-01-01-00-00'
FROM toolboxes tb
LEFT JOIN tools tl ON tl.owner = tb.id AND tl.identifier = '2-01-01-00-00'
WHERE tl.id IS NULL;
