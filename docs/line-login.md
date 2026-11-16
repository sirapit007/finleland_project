# LINE Login

## Setup

Configure `LINE_LOGIN_CHANNEL_ID`, `LINE_LOGIN_CHANNEL_SECRET`,
`LINE_LOGIN_CALLBACK_URL`, `LINE_PROVIDER_ID`, and `JWT_SECRET` on the server.
`LINE_STATE_SECRET` is optional and falls back to `JWT_SECRET`. Never expose
the channel secret to the browser.

To prefill email, first obtain LINE's email permission for the channel, then
set `LINE_LOGIN_EMAIL_ENABLED=true`. Leave it unset otherwise. Even when enabled,
email may be unavailable or not granted; the user can enter it manually.

Keep the existing profile-link callback in the LINE Developers Console and add
the registration/login callback `/api/auth/line/callback` on the same origin as
`LINE_LOGIN_CALLBACK_URL`. Configure the URLs separately for each environment.
Desktop login requests LINE's QR screen by default; LINE may display an existing
SSO session instead.

Apply `database/production/20261110_line_login_verified.sql` to the target
database before enabling the new login flow. Check the migration's duplicate
preflight before creating unique indexes. Existing LINE links remain available
for notifications, but users must verify the link again from Profile before
using it to sign in.

The migration also stores a one-use signup proof hash in the existing OTP
table. Any OTP cleanup job must retain consumed rows with a LINE proof for at
least 30 minutes after consumption, so an unexpired proof cannot be reused.

Registration keeps the existing required information, password, phone OTP,
and signup coupons. Matching an email address or phone number does not link an
existing account automatically.
