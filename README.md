# 24digiBackend

Production-ready Node.js (Express) + MongoDB (Mongoose) REST API with JWT auth, OTP challenge flow, and fitness onboarding profile.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB with Mongoose
- **Auth:** JWT (access + refresh), OTP challenge (hash, expiry, attempts, resend cooldown)
- **Validation:** Zod + centralized validation middleware
- **Security:** Helmet, CORS, rate limiting (stricter for OTP), input sanitization
- **Logging:** Morgan (dev) + logger util
- **Config:** dotenv

## Project Structure

```
src/
  app.js              # Express app (middleware, routes)
  server.js            # DB connect + start server
  config/
    db.js              # MongoDB connection
    env.js             # Environment config
  models/
    User.js
    OtpChallenge.js
    RefreshToken.js
  routes/
    auth.routes.js
    profile.routes.js
  controllers/
    auth.controller.js
    profile.controller.js
  services/
    auth.service.js
    otp.service.js
    token.service.js
    profile.service.js
  middleware/
    auth.middleware.js
    validate.middleware.js
    error.middleware.js
    rateLimit.middleware.js
  validators/
    auth.validators.js
    profile.validators.js
  utils/
    response.js
    errors.js
    crypto.js
    mask.js
    enums.js
    logger.js
postman/
  Fitness-Onboarding-API.postman_collection.json
```

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

Copy `.env.example` to `.env` and set values:

```bash
cp .env.example .env
```

Edit `.env`:

- `MONGO_URI` – MongoDB connection string (e.g. `mongodb://localhost:27017/24digi`)
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` – Strong secrets (min 32 chars)
- Optional: adjust `PORT`, JWT expires, OTP settings, `CORS_ORIGIN`

### 3. Run locally

**Development (with nodemon):**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

Server listens on `PORT` (default `4000`). In development, OTP is printed to the server console (no real SMS/email).

### 4. Lint

```bash
npm run lint
```

## API Overview

### Base URL

- Local: `http://localhost:4000`

### Response format

- Success: `{ "success": true, "data": { ... }, "error": null }`
- Error: `{ "success": false, "data": null, "error": { "message": "...", "code": "...", "details": [...] } }`

### Auth (no token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login/start` | Start OTP (phone or email), returns `challenge_id` |
| POST | `/auth/login/verify-otp` | Verify OTP, returns access + refresh tokens and user |
| POST | `/auth/login/resend-otp` | Resend OTP (cooldown + max resends enforced) |
| POST | `/auth/token/refresh` | Rotate refresh token, get new access + refresh |
| POST | `/auth/logout` | Revoke refresh token |

### Profile (Bearer token required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile/me` | Current user profile (includes age, BMI) |
| PUT/PATCH | `/profile/basic` | Name, DOB, height, weight, gender |
| PUT/PATCH | `/profile/health` | Health considerations |
| PUT/PATCH | `/profile/nutrition` | Food allergies, dietary goal |
| PUT/PATCH | `/profile/activity` | Activity level, workouts, days off, timezone |
| PUT/PATCH | `/profile/goals` | Primary goal, current build |
| POST | `/profile/finish` | Confirm consents and mark profile complete |

### Health

- `GET /health` – Returns `{ success: true, data: { status: "ok" } }`

## Postman

Import `postman/Fitness-Onboarding-API.postman_collection.json` into Postman.

1. **Login flow:** Run **Auth → Login Start (Phone)** or **(Email)**. Set `challenge_id` from the response (or copy from response into variable).
2. In dev, read the 6-digit OTP from the server console, then run **Verify OTP** with that `otp_code` and the same `challenge_id`. The collection can save `access_token` and `refresh_token` from the verify response.
3. Use **Profile** requests with `Authorization: Bearer {{access_token}}`.

Collection variables: `baseUrl`, `access_token`, `refresh_token`, `challenge_id`.

## OTP (development)

- OTP is **not** sent by SMS/email. It is logged to the server console, e.g. `[DEV] OTP for +971501234567 : 123456`.
- Use that code in **Verify OTP** to complete login.

## Deploy on AWS (Elastic Beanstalk)

The app listens on `process.env.PORT` (AWS sets this automatically). Use **Elastic Beanstalk** for the simplest deployment.

### 1. Prerequisites

- AWS account
- [EB CLI](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html) (optional; you can use the AWS Console instead)

### 2. Create environment in AWS Console

1. Go to **AWS Console** → **Elastic Beanstalk** → **Create Application**.
2. **Application name:** e.g. `24digi-backend`.
3. **Platform:** Node.js (use the recommended Node 18+ platform).
4. **Application code:** Upload your code (zip of the project, excluding `node_modules` and `.env`) or connect to **GitHub** (recommended).
5. **Create environment** and wait for the first deployment.

### 3. Set environment variables

In Elastic Beanstalk → your environment → **Configuration** → **Software** → **Edit** → **Environment properties**, add at least:

| Name | Description |
|------|-------------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` or `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET` | JWT secrets |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | Your frontend origin(s), e.g. `https://your-app.com` or `*` for testing |

Add any other vars from your `.env` (e.g. `ACCESS_TOKEN_EXPIRY_DAYS`, Stripe, SMS, etc.). **Do not** commit `.env` to Git.

### 4. Deploy from Git (recommended)

- In **Elastic Beanstalk** → **Application** → **Application versions**, use **Deploy** and point to your GitHub repo, or
- With EB CLI from your machine:
  ```bash
  eb init -p "Node.js 18" 24digi-backend --region us-east-1
  eb create 24digi-backend-prod
  eb setenv MONGO_URI="..." JWT_SECRET="..." NODE_ENV=production
  eb deploy
  ```

### 5. Your API URL

After deployment, use the environment URL shown in Beanstalk (e.g. `https://24digi-backend.us-east-1.elasticbeanstalk.com`). Update your Postman/frontend base URL to this.

### Alternative: AWS App Runner

You can also deploy by building a **Dockerfile** and deploying to **App Runner** (deploy from GitHub or ECR). The same environment variables must be set in App Runner.

## License

ISC
