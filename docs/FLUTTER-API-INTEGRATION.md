# Flutter + 24digiBackend API Integration (Cursor Command)

Use this doc as the single source of truth when implementing the Flutter frontend that talks to the 24digiBackend API. Give this file (or its summary) to Cursor when you say: "Integrate these APIs into my Flutter app" or "Build the API layer for this backend."

---

## API base

- **Production:** `http://24digi-backend-prod.eba-uixgxim5.eu-north-1.elasticbeanstalk.com`
- **Local:** `http://localhost:4000` (or your machine IP for device/emulator)

All responses follow:

- **Success:** `{ "success": true, "data": { ... }, "error": null }`
- **Error:** `{ "success": false, "data": null, "error": { "message": "...", "code": "...", "details": [...] } }`

Use **Dio** (or `http`) with a base URL and parse `data` / `error` from the JSON body.

---

## Auth flow (no token)

### 1. POST `/auth/login/start`

**Request:**

```json
{
  "login_method": "phone" | "email",
  "phone_number": "+971501234567",   // required if login_method is "phone"
  "email": "user@example.com",       // required if login_method is "email"
  "country_code": "AE",
  "language": "en" | "ar",
  "device": {
    "device_id": "string",
    "platform": "ios" | "android" | "web",
    "app_version": "1.0.0",
    "push_token": "optional"
  }
}
```

**Response (200):** `data` = `{ "challenge_id": "uuid", "otp_sent_to": "+971******123", "expires_in_sec": 300 }`

Store `challenge_id` for verify and resend.

---

### 2. POST `/auth/login/verify-otp`

**Request:**

```json
{
  "challenge_id": "uuid-from-login-start",
  "otp_code": "123456",
  "device": { "device_id": "...", "platform": "android" }
}
```

**Response (200):** `data` = `{ "access_token": "...", "refresh_token": "...", "user": { "user_id": "...", "is_profile_complete": false } }`

Store `access_token` and `refresh_token` (e.g. `flutter_secure_storage`). Navigate to home or onboarding based on `is_profile_complete`.

**OTP bypass (dev):** When the backend has `OTP_BYPASS_ENABLED=true`, you can skip the OTP screen: after login/start, call verify-otp with `otp_code: "000000"` (or the backend’s `OTP_BYPASS_CODE`). The API returns tokens and you can go to the next screen. Use only in dev builds.

---

### 2b. POST `/auth/login/verify-firebase` (Phone only)

Use **Firebase Phone Auth** in the app; then send the Firebase ID token to this endpoint. Same response as verify-otp.

**Request:**

```json
{
  "firebase_id_token": "<idToken from Firebase Auth after phone sign-in>",
  "device": {
    "device_id": "string",
    "platform": "android",
    "app_version": "1.0.0",
    "push_token": "optional"
  }
}
```

**Response (200):** same as verify-otp: `data.access_token`, `data.refresh_token`, `data.user` (`user_id`, `is_profile_complete`).

Flow: App calls `FirebaseAuth.instance.verifyPhoneNumber(...)` → user gets SMS from Firebase → sign in with credential → `user.getIdToken(true)` → POST this endpoint with `firebase_id_token` → store tokens and navigate.

---

### 3. POST `/auth/login/resend-otp`

**Request:** `{ "challenge_id": "uuid" }`  
**Response (200):** `data` = `{ "expires_in_sec": 300 }`

---

### 4. POST `/auth/token/refresh`

**Request:** `{ "refresh_token": "..." }`  
**Response (200):** `data` = `{ "access_token": "...", "refresh_token": "..." }`

Use when API returns 401. Refresh, store new tokens, retry the request.

---

### 5. POST `/auth/logout`

**Request:** `{ "refresh_token": "..." }`  
**Response (200):** `data` = `{ "success": true }`

Clear tokens and go to login.

---

## Profile (Bearer token required)

All profile requests need header: **`Authorization: Bearer <access_token>`**

### GET `/profile/me`

**Response (200):** `data` = full profile, e.g.:

- `name`, `date_of_birth`, `age`, `gender`, `height_cm`, `weight_kg`, `bmi`
- `primary_goal`, `dietary_goal`, `food_allergies`, `other_allergy_text`
- `activity_level`, `preferred_workouts`, `workouts_per_week`, `days_off`, `timezone`
- `current_build`, `health_considerations`, `is_profile_complete`

Use for "Review" screen and pre-filling forms.

---

### PUT / PATCH `/profile/basic`

**PUT body:** `{ "name", "date_of_birth" (YYYY-MM-DD), "height_cm", "weight_kg", "gender" }`  
**PATCH body:** same fields, all optional.  
**Response (200):** `data` = `{ "profile": { ... } }`

Validation: age ≥ 13, height 50–250, weight 20–400.

---

### PUT / PATCH `/profile/health`

**Body:** `{ "health_considerations": ["heart_conditions", ...] }`  
If `"none_prefer_not_to_say"` is included, it must be the only item.

---

### PUT / PATCH `/profile/nutrition`

**Body:** `{ "food_allergies": ["dairy","other"], "other_allergy_text": "Kiwi", "dietary_goal": "balanced" | "high_protein" | "vegan" | "light_fresh" }`  
If `"other"` in `food_allergies`, `other_allergy_text` is required. If `"none"`, it must be the only item.

---

### PUT / PATCH `/profile/activity`

**Body:** `{ "activity_level", "preferred_workouts", "workouts_per_week" (0–7), "days_off", "timezone" }`  
If `"no_preference"` in `preferred_workouts`, it must be the only item.

---

### PUT / PATCH `/profile/goals`

**Body:** `{ "primary_goal", "current_build" }`  
Enums: primary_goal e.g. `improve_fitness`, `muscle_gain`, `lose_weight`, `increase_endurance`, `stay_healthy`; current_build e.g. `lean`, `average`, `muscular`, `athletic`, `higher_body_fat`.

---

### POST `/profile/finish`

**Body:** `{ "confirm": true, "consents": { "terms_accepted": true, "privacy_accepted": true, "health_disclaimer_accepted": true } }`  
**Response (200):** `data` = `{ "profile": {...}, "is_profile_complete": true }`

Call after user accepts consents; then navigate to main app.

---

## Enums (for dropdowns / validation)

- **Genders:** `female`, `male`, `other`
- **Health considerations:** `heart_conditions`, `blood_pressure`, `breathing_lungs`, `sleep_recovery`, `blood_sugar_metabolism`, `none_prefer_not_to_say`
- **Food allergies:** `none`, `dairy`, `eggs`, `gluten`, `shellfish`, `soy`, `sesame`, `fish`, `other`
- **Dietary goals:** `balanced`, `high_protein`, `vegan`, `light_fresh`
- **Activity levels:** `mostly_inactive`, `lightly_active`, `moderately_active`, `very_active`
- **Preferred workouts:** `walking_light`, `strength_training`, `cardio`, `sports`, `yoga_stretching`, `at_home`, `gym`, `no_preference`
- **Days off:** `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`
- **Primary goals:** `improve_fitness`, `muscle_gain`, `lose_weight`, `increase_endurance`, `stay_healthy`
- **Current build:** `lean`, `average`, `muscular`, `athletic`, `higher_body_fat`

---

## Flutter implementation checklist

1. **Config:** Base URL (prod vs dev) from env or constants.
2. **HTTP client:** Dio with `baseUrl`, `connectTimeout`, `receiveTimeout`. Add interceptors: attach `Authorization: Bearer <access_token>`; on 401, call refresh then retry (or clear tokens and go to login).
3. **Auth repository:** `loginStart`, `verifyOtp`, `resendOtp`, `refreshTokens`, `logout`; store/read tokens (e.g. `flutter_secure_storage`).
4. **Profile repository:** `getMe`, `updateBasic`, `updateHealth`, `updateNutrition`, `updateActivity`, `updateGoals`, `finishProfile` (PUT/PATCH as needed).
5. **Models:** DTOs for API request/response matching the shapes above; parse `data` and `error` from the standard envelope.
6. **State:** Provider / Riverpod / Bloc for auth state (token, user, isProfileComplete) and profile; after login, fetch `GET /profile/me` and branch to onboarding or home.
7. **UI:** Login (phone/email) → OTP screen → then onboarding steps (basic, health, nutrition, activity, goals, review, finish) or home if `is_profile_complete`.

---

## Cursor prompt (copy-paste)

When working in your Flutter project, you can say:

**"Integrate the 24digiBackend API into this Flutter app. Use the spec in `docs/FLUTTER-API-INTEGRATION.md` in the 24digiBackend repo (or the content I pasted). Implement: (1) API client with Dio, base URL and auth interceptor with refresh-on-401; (2) auth repo (login start, verify OTP, refresh, logout) with secure token storage; (3) profile repo (get me, update basic/health/nutrition/activity/goals, finish); (4) response models for the standard envelope and auth/profile DTOs; (5) wire login → OTP → onboarding or home based on is_profile_complete. Base URL: http://24digi-backend-prod.eba-uixgxim5.eu-north-1.elasticbeanstalk.com"**

Adjust the path to the doc or paste the relevant sections into the chat if the Flutter app is in a different repo.
