# Cloudflare Migration Guide for Hairotic.ng

This guide details the complete step-by-step migration of **Hairotic.ng** to Cloudflare services:
1. **Frontend Hosting:** Cloudflare Pages (Next.js 14+ App Router via `@cloudflare/next-on-pages` / Wrangler)
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

---

## 2. Frontend Cloudflare Pages Deployment

### Step 2.1: Local Build Verification
From the `/frontend` directory, test the Cloudflare Pages build:
```bash
cd frontend
npm install
npm run pages:build
```
This generates the edge-compatible static and serverless build bundle inside `.vercel/output/static`.

### Step 2.2: Wrangler Manual Deployment
To deploy directly via Wrangler CLI:
```bash
npx wrangler login
npm run pages:deploy
```

### Step 2.3: Connecting Cloudflare Pages to GitHub
1. In Cloudflare Dashboard, go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Select repository: `hairotic-ng`.
3. Set build configuration:
   - **Framework preset:** `Next.js (Static Export / @cloudflare/next-on-pages)`
   - **Build command:** `npm run pages:build`
   - **Build output directory:** `.vercel/output/static`
   - **Root directory:** `frontend`
4. Add Environment Variables under **Settings** > **Environment variables**:
   - `NEXT_PUBLIC_API_URL`: `https://api.hairotic.ng`
   - `NODE_VERSION`: `22`

---

## 3. DNS, Custom Domains & Reverse Proxy Setup

### Step 3.1: Domain Nameserver (NS) Setup
1. In Cloudflare Dashboard, click **Add a site** and enter `hairotic.ng`.
2. Select the **Free / Pro** plan.
3. Update your domain registrar's Nameservers to Cloudflare's assigned nameservers (e.g., `ns1.cloudflare.com`, `ns2.cloudflare.com`).

### Step 3.2: DNS Records Setup
Configure the following DNS records in Cloudflare DNS:

| Type | Name | Target / Value | Proxy status |
|---|---|---|---|
| CNAME | `@` (root) | `hairotic-ng.pages.dev` | Proxied (Orange Cloud) |
| CNAME | `www` | `hairotic-ng.pages.dev` | Proxied (Orange Cloud) |
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
