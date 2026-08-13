-- Migration 011: drop payment-related tables
-- The app is now free for anyone with the link — no accounts, no Stripe,
-- no email-based recovery. `customers` (paid-account tracking + OTP
-- recovery tokens) and `rate_limits` (used only by the now-deleted
-- checkout/verify-session/recover/verify-recovery endpoints) have no
-- remaining code consumers. Trips/meals/items/expenses are untouched.

drop trigger if exists rate_limits_cleanup on rate_limits;
drop function if exists prune_rate_limits();

drop table if exists customers;
drop table if exists rate_limits;
