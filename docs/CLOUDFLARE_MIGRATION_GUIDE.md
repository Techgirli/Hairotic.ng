# Cloudflare Migration Guide for Hairotic.ng

This guide details the complete step-by-step migration of **Hairotic.ng** to Cloudflare services:
1. **Frontend Hosting:** Cloudflare Workers (Next.js via `@opennextjs/cloudflare`)
2. **Media Storage:** Cloudflare R2 Object Storage (Replacing Cloudinary with zero egress fees)
3. **API & Edge Routing:** Cloudflare Workers & Proxy Routing
4. **DNS, CDN & Security:** Cloudflare WAF, Rate Limiting, DDoS Protection & SSL/TLS

---

## 1. Cloudflare R2 Media Storage Setup

### Step 1.1: Create R2 Bucket
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **R2 Object Storage** in the left sidebar.
3. Click **Create bucket** and name it: `hairotic-media`.
4. Enable **Public Access** or connect a custom domain (e.g., `media.hairotic.ng`).

### Step 1.2: Generate API Access Keys
1. In R2 Object Storage, click **Manage R2 API Tokens**.
2. Click **Create API Token**.
3. Set permissions to **Admin Read & Write**.
4. Save the generated credentials:
   - `CLOUDFLARE_R2_ACCOUNT_ID`
   - `CLOUDFLARE_R2_ACCESS_KEY_ID`
   - `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
   - `CLOUDFLARE_R2_BUCKET_NAME` (`hairotic-media`)
   - `CLOUDFLARE_R2_PUBLIC_URL` (`https://media.hairotic.ng`)

### Step 1.3: Configure Backend `.env`
Add the following environment variables to `backend/.env`:
```env
CLOUDFLARE_R2_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key
CLOUDFLARE_R2_BUCKET_NAME=hairotic-media
CLOUDFLARE_R2_PUBLIC_URL=https://media.hairotic.ng
```

The NestJS API runs directly on Cloudflare Workers; it is not proxied to
Render. Neon remains the PostgreSQL provider and is reached through Cloudflare
Hyperdrive.

### Step 1.4: Connect Neon with Hyperdrive
1. In Cloudflare, create a Hyperdrive configuration connected to the existing
   Neon PostgreSQL database.
2. Copy its ID into the `HYPERDRIVE.id` field in `backend/wrangler.json`,
   replacing `REPLACE_WITH_HYPERDRIVE_ID`.
3. Confirm the Hyperdrive connection can access the production schema. Continue
   running reviewed Prisma migrations against Neon from a trusted deployment
   environment; do not apply migrations automatically from Worker startup.

### Step 1.5: Configure Worker secrets and deploy
From `backend/`, set each secret using `npx wrangler secret put SECRET_NAME`.
Use the production values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
`PAYSTACK_SECRET_KEY`, `RECONCILE_SECRET`, `GOOGLE_CLIENT_ID`,
`CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`,
`CLOUDFLARE_R2_SECRET_ACCESS_KEY`, and `CLOUDFLARE_R2_PUBLIC_URL`. These
secrets are not stored in `wrangler.json`. The Worker uses the existing
`hairotic-media` R2 bucket and Resend integration; `APP_URL`,
`RESEND_FROM_EMAIL`, `CLOUDFLARE_R2_BUCKET_NAME`, and `NODE_ENV` are
non-secret variables in `backend/wrangler.json`.

In Cloudflare Workers Builds, set:
- **Root directory:** `backend`
- **Build command:** `npm ci && npm run cf:build`
- **Deploy command:** `npx wrangler deploy`
- **Node.js version:** `22`

The same deployment can be run locally from `backend/` with `npm ci` and
`npm run deploy`. The Worker uses the fetch-native
NestJS adapter; the existing `main.ts` remains the local/Node server entry
point. `api.hairotic.com.ng` is configured as a custom domain on
`my-hairotic-backend-worker`.

Set the GitHub Actions `API_URL` secret to `https://api.hairotic.com.ng` so the
payment reconciliation workflow calls the Worker. After verifying API health,
checkout, Paystack webhooks, authentication cookies, and media uploads on the
Worker, disable the Render API service; keep Neon and the other external
integrations.

---

## 2. Frontend Cloudflare Workers Deployment

The frontend is a Next.js application deployed as a Worker with
`@opennextjs/cloudflare`; do not use the Pages adapter or `wrangler pages`
commands.

### Step 2.1: Local Preview and Deployment
From the `/frontend` directory, preview the app in the Workers runtime or deploy
it directly:
```bash
cd frontend
npm ci
npm run preview
npm run deploy
```

### Step 2.2: Connecting the Worker to Git
In Cloudflare Workers Builds, connect the repository and configure:

- **Root directory:** `frontend` (Wrangler config and package scripts live here)
- **Build command:** `npm run cf:build`
- **Deploy command:** `npx wrangler deploy`
- **Build environment variable:** `NEXT_PUBLIC_API_URL=https://api.hairotic.com.ng/api/v1`
- **Build environment variable:** `NEXT_PUBLIC_SITE_URL=https://www.hairotic.com.ng`
- **Node.js version:** `22`

The OpenNext build creates `.open-next/worker.js`; Wrangler deploys it using
`frontend/wrangler.json`. Running `npx wrangler deploy` at the repository root
does not find the frontend config or build output, which causes the static
files error. Next.js image optimization is disabled to avoid requiring a
separately billed Cloudflare Images binding.

`www.hairotic.com.ng` is declared as a Worker custom domain in
`frontend/wrangler.json`; the apex is intentionally excluded because its
existing DNS records must be migrated separately. If deployment reports that
`www` has an existing DNS record, remove only the conflicting `www` website
record in Cloudflare DNS, then redeploy. Keep email MX/TXT records. Cloudflare
manages the Worker DNS record and TLS certificate after the custom domain is
attached.

To serve `hairotic.com.ng` directly from the Worker later, first remove or
replace its existing website A/CNAME record in Cloudflare DNS, then add the
apex custom domain in the Worker dashboard or Wrangler config. Do not remove
email MX/TXT records.

---

## 3. DNS, Custom Domains & Reverse Proxy Setup

### Step 3.1: Domain Nameserver (NS) Setup
1. In Cloudflare Dashboard, click **Add a site** and enter `hairotic.ng`.
2. Select the **Free / Pro** plan.
3. Update your domain registrar's Nameservers to Cloudflare's assigned nameservers (e.g., `ns1.cloudflare.com`, `ns2.cloudflare.com`).

### Step 3.2: DNS Records Setup
Attach the frontend domains to the `hairotic-ng` Worker as described in
Step 2.2; do not point them at `hairotic-ng.pages.dev`. The API hostname is
attached to `my-hairotic-backend-worker` by its custom-domain route. Configure
the remaining records in Cloudflare DNS:

| Type | Name | Target / Value | Proxy status |
|---|---|---|---|
| CNAME | `media` | `hairotic-media.r2.dev` | Proxied (Orange Cloud) |

### Step 3.3: SSL/TLS & Security Settings
1. **SSL/TLS Encryption Mode:** Set to **Full (Strict)**.
2. **Always Use HTTPS:** Enable under SSL/TLS > Edge Certificates.
3. **HTTP/3 (with QUIC):** Enable for faster mobile performance in Nigeria.
4. **Brotli Compression:** Enable.
5. **Auto Minify:** Enable JavaScript, CSS, HTML.

---

## 4. Security Rules & WAF Configuration

### Step 4.1: Rate Limiting Rules
Set up Cloudflare WAF Rate Limiting rules under **Security** > **WAF** > **Rate limiting rules**:
1. **Auth Endpoints Protection:**
   - URL Path: `/api/v1/auth/*`
   - Limit: 10 requests per minute per IP address.
   - Action: Block / Challenge.
2. **Checkout & Payment Webhooks:**
   - Allow Paystack IP range directly through WAF bypass.
   - Limit `/api/v1/checkout/*` to 15 requests per minute per IP.

### Step 4.2: Bot Management & Challenge Pass
1. Enable **Bot Fight Mode** under **Security** > **Bots**.
2. Block automated scrapers and bad user-agents targeting `/api/v1/catalog/*`.

---

## 5. CI/CD GitHub Actions Workflow

Deployments are automated via `.github/workflows/deploy-cloudflare.yml`.
Ensure the following GitHub Repository Secrets are set in GitHub (`Settings` > `Secrets and variables` > `Actions`):
- `CLOUDFLARE_API_TOKEN`: Cloudflare API Token with Pages & Workers edit access.
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID.
- `NEXT_PUBLIC_API_URL`: `https://api.hairotic.com.ng/api/v1`

---

## 6. Verification & Health Checks

After deployment, run the following verification checks:
1. **Edge Headers:** `curl -I https://hairotic.ng` (Verify `x-content-type-options`, `strict-transport-security`, and Cloudflare `CF-RAY` headers).
2. **Frontend Route Hydration:** Open `https://hairotic.ng` and verify cart state, product navigation, and image loading.
3. **Media Upload:** Test uploading product media to Cloudflare R2 via `/api/v1/storage/presigned-url`.
