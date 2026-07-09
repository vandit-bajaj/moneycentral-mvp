-- 0002_add_indexes.sql

-- Index on user_id for family_members (used in every RLS policy)
CREATE INDEX idx_family_members_user_id
ON family_members(user_id);

-- Index on user_id for holdings (used in every RLS policy)
CREATE INDEX idx_holdings_user_id
ON holdings(user_id);

-- Index on member_id for holdings (used in joins and filters)
CREATE INDEX idx_holdings_member_id
ON holdings(member_id);

-- Composite index for the most common query pattern:
-- "give me all holdings for user X and member Y"
CREATE INDEX idx_holdings_user_member
ON holdings(user_id, member_id);
