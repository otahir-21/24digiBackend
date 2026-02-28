# Connect Firebase to Elastic Beanstalk (EB)

The backend needs **Firebase Admin** only to **verify** the Firebase ID token your app sends after phone auth. You give EB the Firebase service account so the Node app can run `verifyIdToken()`.

---

## Option A: Environment variable (recommended for EB)

Use a **single environment variable** with the full service account JSON. No file upload.

### 1. Get the service account JSON from Firebase

1. Open [Firebase Console](https://console.firebase.google.com/) → your project.
2. **Project settings** (gear) → **Service accounts**.
3. Click **Generate new private key** (or use an existing one).  
   This downloads a JSON file like `your-project-firebase-adminsdk-xxxxx.json`.

4. **Keep this file secret.** Do not commit it to git.

### 2. Set the variable in Elastic Beanstalk

1. **AWS Console** → Elastic Beanstalk → your environment (e.g. `24digi-backend-prod`).
2. **Configuration** → **Software** → **Edit**.
3. Under **Environment properties**, add:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value:** the **entire JSON** from the downloaded file, as a **single line** (no line breaks).

**How to make it one line:**

- **Mac/Linux:**  
  `cat /path/to/your-project-firebase-adminsdk-xxxxx.json | jq -c .`
- **Or manually:** Open the JSON file, remove all newlines so it looks like:  
  `{"type":"service_account","project_id":"your-project",...}`

4. **Apply** and let the environment update. The app will restart with the new env.

After this, `POST /auth/login/verify-firebase` will work: the backend will verify the Firebase ID token and issue your tokens.

---

## Option B: File on the instance (optional)

If you prefer a file instead of an env var:

1. Put the service account JSON on the EC2 instance (e.g. via `.ebextensions` or S3 + user script).
2. Set environment variable **Name:** `GOOGLE_APPLICATION_CREDENTIALS`, **Value:** full path to that file on the instance (e.g. `/var/app/current/firebase-service-account.json`).

Option A is simpler on EB because you don’t manage files or paths.

---

## Check that it works

- In the app: complete phone auth, get the Firebase ID token, call `POST /auth/login/verify-firebase`.
- If Firebase is configured correctly you get `200` with `access_token` and `refresh_token`.
- If not configured or invalid token you get `401` / `400` and the backend logs “Firebase not configured” or “invalid_firebase_token”.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Firebase Console → Service accounts → Generate new private key (download JSON). |
| 2 | EB → Configuration → Software → Environment properties. |
| 3 | Add `FIREBASE_SERVICE_ACCOUNT_JSON` = entire JSON as one line. |
| 4 | Apply; backend can now verify Firebase ID tokens for phone auth. |
