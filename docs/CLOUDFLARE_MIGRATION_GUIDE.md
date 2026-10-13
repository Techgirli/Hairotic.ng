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

For the backend Worker, keep credentials out of `backend/wrangler.json` and set
them as Worker secrets instead. From `backend/`, run `npx wrangler secret put`
for each secret (`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
`PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`, `REDIS_URL`, `RECONCILE_SECRET`, and
`CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, and
`CLOUDFLARE_R2_SECRET_ACCESS_KEY`). Use the Cloudflare dashboard's Worker
secrets settings if configuring them there. Set `REDIS_URL` to the production
Upstash connection string, not the local Redis URL.

`APP_URL`, `RESEND_FROM_EMAIL`, `NODE_ENV`, and `CLOUDFLARE_R2_BUCKET_NAME`
are non-secret Worker variables and are declared in `backend/wrangler.json`.
`CLOUDINARY_URL`, `WHATSAPP_CLOUD_API_TOKEN`, and `SENTRY_DSN` are included in
the environment template but are not currently consumed by the backend.

### Step 1.4: Deploy the Backend Worker
In Cloudflare Workers Builds, set the repository root directory to `backend`,
the build command to `npm ci && npm run build`, and the deploy command to
`npx wrangler deploy`. This makes Wrangler use `backend/wrangler.json` and
ensures `dist/main.js` exists before deployment. If the build root must remain
the repository root, use `npm ci --prefix backend && npm run build --prefix backend`
as the build command and `npx wrangler deploy --config backend/wrangler.json`
as the deploy command.

The current `backend/src/main.ts` starts a conventional NestJS/Express HTTP
server with `app.listen()`. Cloudflare Workers require a module entry point that
handles requests via a `fetch` export; `nodejs_compat` does not turn a listening
NestJS server into a Worker handler. Adapt the backend to a Worker-compatible
entry point before expecting the deployed API to run.

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
- **Build environment variable:** `NEXT_PUBLIC_API_URL=https://api.hairotic.ng/api/v1`
- **Build environment variable:** `NEXT_PUBLIC_SITE_URL=https://www.hairotic.com.ng`
- **Node.js version:** `22`

The OpenNext build creates `.open-next/worker.js`; Wrangler deploys it using
`frontend/wrangler.json`. Running `npx wrangler deploy` at the repository root
does not find the frontend config or build output, which causes the static
files error. Next.js image optimization is disabled to avoid requiring a
separately billed Cloudflare Images binding.

After the first deployment, attach `hairotic.com.ng` and
`www.hairotic.com.ng` to the `hairotic-ng` Worker under **Settings > Domains &
Routes > Add Custom Domain**. Cloudflare will configure DNS for those Worker
domains.

---

## 3. DNS, Custom Domains & Reverse Proxy Setup

### Step 3.1: Domain Nameserver (NS) Setup
1. In Cloudflare Dashboard, click **Add a site** and enter `hairotic.ng`.
2. Select the **Free / Pro** plan.
3. Update your domain registrar's Nameservers to Cloudflare's assigned nameservers (e.g., `ns1.cloudflare.com`, `ns2.cloudflare.com`).

### Step 3.2: DNS Records Setup
Attach the frontend domains to the `hairotic-ng` Worker as described in
Step 2.2; do not point them at `hairotic-ng.pages.dev`. Configure the remaining
records in Cloudflare DNS:

| Type | Name | Target / Value | Proxy status |
|---|---|---|---|
| CNAME | `api` | `backend-host-or-worker.render.com` | Proxied (Orange Cloud) |
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
- `NEXT_PUBLIC_API_URL`: `https://api.hairotic.ng`

---

## 6. Verification & Health Checks

After deployment, run the following verification checks:
1. **Edge Headers:** `curl -I https://hairotic.ng` (Verify `x-content-type-options`, `strict-transport-security`, and Cloudflare `CF-RAY` headers).
2. **Frontend Route Hydration:** Open `https://hairotic.ng` and verify cart state, product navigation, and image loading.
3. **Media Upload:** Test uploading product media to Cloudflare R2 via `/api/v1/storage/presigned-url`.
