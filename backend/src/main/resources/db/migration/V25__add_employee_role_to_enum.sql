-- V25__add_employee_role_to_enum.sql
-- Adds EMPLOYEE to the user_role enum type in PostgreSQL.
-- The Java Role enum already has EMPLOYEE, but the DB enum was missing it.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'EMPLOYEE';
