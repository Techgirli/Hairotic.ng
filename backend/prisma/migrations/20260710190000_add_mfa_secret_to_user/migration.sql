-- AddColumn: mfa_secret on users table
-- Stores the TOTP secret for ADMIN/STAFF MFA.
-- Nullable — null until the user completes MFA setup.
-- This replaces the previous insecure approach of storing secrets in customer_notes.
ALTER TABLE "users" ADD COLUMN "mfa_secret" TEXT;
