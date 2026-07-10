-- AddColumns: email_verified, verification_token, reset_token, reset_token_expiry on users table
-- email_verified: gates login for customer accounts until email is confirmed
-- verification_token: one-time UUID token sent to the user's email; cleared on verify
-- reset_token: one-time UUID token for password reset; cleared on use
-- reset_token_expiry: 1-hour window after which the reset token is invalid
ALTER TABLE "users"
  ADD COLUMN "email_verified"     BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN "verification_token" TEXT      UNIQUE,
  ADD COLUMN "reset_token"        TEXT      UNIQUE,
  ADD COLUMN "reset_token_expiry" TIMESTAMP(3);
