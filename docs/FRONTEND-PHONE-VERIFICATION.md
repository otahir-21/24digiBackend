# Frontend: Phone verification (Firebase + Backend)

Give this to your Flutter/frontend team (or to Cursor when working on the app). It’s everything needed for **phone login**: Firebase Phone Auth → backend → your tokens.

---

## Base URL

- **Production:** `http://24digi-backend-prod.eba-uixgxim5.eu-north-1.elasticbeanstalk.com`
- **Local:** `http://localhost:4000`

---

## Flow (what the app must do)

1. User enters **phone number** (with country code, e.g. `+971501234567`).
2. App calls **Firebase Phone Auth** (`FirebaseAuth.instance.verifyPhoneNumber(...)`).  
   Firebase sends the SMS and shows reCAPTCHA if needed.
3. User enters the **code** from SMS. App signs in with the **PhoneAuthCredential** and gets the Firebase **User**.
4. App gets the **Firebase ID token:**  
   `String idToken = await user.getIdToken(true);`
5. App calls **our backend** with that token (see API below).
6. Backend returns **our** `access_token` and `refresh_token`. App stores them (e.g. secure storage) and uses them for all other API calls. Navigate to home or onboarding based on `user.is_profile_complete`.

**Important:** We do **not** use backend OTP for phone. We use Firebase for SMS/verification; the backend only verifies the Firebase token and issues our tokens.

---

## API: Verify Firebase token and get our tokens

**Endpoint:** `POST /auth/login/verify-firebase`

**Headers:** `Content-Type: application/json`

**Request body:**

```json
{
  "firebase_id_token": "<paste the idToken from step 4 above>",
  "device": {
    "device_id": "string",
    "platform": "android",
    "app_version": "1.0.0",
    "push_token": "optional"
  }
}
```

- `firebase_id_token` — **Required.** The string returned by `user.getIdToken(true)` after Firebase phone sign-in.
- `device` — **Optional.** Same shape as other auth endpoints; you can send `device_id`, `platform`, `app_version`, `push_token`.

**Success (200):**

```json
{
  "success": true,
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "user": {
      "user_id": "...",
      "is_profile_complete": false
    }
  },
  "error": null
}
```

**What to do:** Save `data.access_token` and `data.refresh_token`. Use `Authorization: Bearer <access_token>` for all other API requests. If `data.user.is_profile_complete` is `false`, show onboarding; otherwise go to home.

**Errors:**

- **400/401** — Invalid or expired Firebase token (e.g. user not signed in, token expired). Body: `{ "success": false, "error": { "message": "...", "code": "invalid_firebase_token" } }`.  
  → Ask user to sign in again with Firebase (resend code / retry phone auth).

---

## Summary for frontend

| Step | Action |
|------|--------|
| 1 | User enters phone → call Firebase `verifyPhoneNumber`. |
| 2 | User enters SMS code → sign in with credential → get `User`. |
| 3 | `String idToken = await user.getIdToken(true);` |
| 4 | `POST /auth/login/verify-firebase` with `{ "firebase_id_token": idToken, "device": { ... } }`. |
| 5 | Store `data.access_token` and `data.refresh_token`; use for all other APIs. |
| 6 | Navigate by `data.user.is_profile_complete` (onboarding vs home). |

No other auth APIs are required for phone login (no `/auth/login/start` or `/auth/login/verify-otp` for phone). Use **refresh** and **logout** as documented in the main API doc when needed.
