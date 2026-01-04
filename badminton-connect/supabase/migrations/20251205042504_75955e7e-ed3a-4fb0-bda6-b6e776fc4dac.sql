-- Add new status values to request_status enum
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'arrived';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'completed';