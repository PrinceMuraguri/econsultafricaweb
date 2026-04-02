ALTER TABLE polls DROP CONSTRAINT polls_status_check;
ALTER TABLE polls ADD CONSTRAINT polls_status_check CHECK (status = ANY (ARRAY['active', 'closed', 'resolved', 'settled']));

ALTER TABLE polls DROP CONSTRAINT polls_outcome_check;