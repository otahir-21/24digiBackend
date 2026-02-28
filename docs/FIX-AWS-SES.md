# Fix AWS SES for email OTP

Follow these steps in order. After each step, trigger email login again and check **EB Logs** for `Email send error` – the log will show the exact error and a **hint**.

---

## 1. See the actual error

1. In **Elastic Beanstalk** → your environment → **Logs** → **Request Logs** → **Last 100 Lines** (or **Full Logs**).
2. Trigger **email login** (POST /auth/login/start with `login_method: "email"` and an email).
3. Search for **`Email send error`** in the log. You’ll see something like:
   - `MessageRejected: Email address is not verified`
   - `AccessDenied`
   - `InvalidParameterValue`
   - `CredentialsError`
4. Use the **hint** in the same log line to know what to fix below.

---

## 2. Verify the sender (FROM) address

SES will not send until the **from** address is verified.

1. Open **AWS Console** → **Amazon SES** (search “SES”).
2. Switch **region** (top right) to **Middle East (UAE) – me-central-1** (or the region in `AWS_SES_REGION`).
3. Left menu → **Verified identities** → **Create identity**.
4. Choose **Email address**.
5. Enter **noreply@24digi.ae** (or your `AWS_SES_FROM_EMAIL`).
6. **Create identity**.
7. Open the **verification email** sent to that address and click the link.
8. In SES, the identity should show status **Verified**.

---

## 3. Sandbox: verify the recipient (TO) address

If your SES account is still in **sandbox** (default), you can only send **to** verified addresses.

1. In **SES** → **Verified identities** → **Create identity**.
2. **Email address** → enter the **email you use to test login** (e.g. your Gmail).
3. **Create identity** → complete the verification link sent to that email.
4. Try email OTP again **to that same address**.

To send to **any** email without verifying each one: in SES go to **Account dashboard** (or Support) and **Request production access**.

---

## 4. IAM: allow SES send

The IAM user whose keys you use in EB must be allowed to send email with SES.

1. **IAM** → **Users** → select the user (the one for `AWS_ACCESS_KEY_ID`).
2. **Permissions** → **Add permissions** → **Attach policies directly**.
3. Search **AmazonSESFullAccess** → tick it → **Add permissions**.

Or create an inline policy (replace `REGION` and `ACCOUNT_ID`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:SendRawEmail"],
      "Resource": "*"
    }
  ]
}
```

---

## 5. Env vars on Elastic Beanstalk

In **EB** → **Configuration** → **Software** → **Environment properties**, ensure:

| Name | Value |
|------|--------|
| `EMAIL_ENABLED` | `true` |
| `AWS_SES_REGION` | `me-central-1` (same region where you verified the identity) |
| `AWS_SES_FROM_EMAIL` | `noreply@24digi.ae` (exactly the verified address) |
| `AWS_SES_FROM_NAME` | `24Digi` |
| `AWS_ACCESS_KEY_ID` | Access key of the IAM user with SES permission |
| `AWS_SECRET_ACCESS_KEY` | That user’s secret key |

**Apply** and wait for the environment to update. Redeploy the app if needed.

---

## 6. Region must match

- **SES** identities are **per region**.
- `AWS_SES_REGION` (e.g. `me-central-1`) must be the **same region** where you verified the from (and to, in sandbox) addresses.
- In the AWS Console, switch to that region before creating/checking identities.

---

## Quick checklist

| Step | Done |
|------|------|
| FROM address verified in SES (in the correct region) | ☐ |
| In sandbox: TO address verified in SES | ☐ |
| IAM user has `ses:SendEmail` (e.g. AmazonSESFullAccess) | ☐ |
| EB env: `EMAIL_ENABLED=true`, `AWS_SES_REGION`, `AWS_SES_FROM_EMAIL`, AWS keys set | ☐ |
| Triggered email login and checked logs for `Email send error` + hint | ☐ |

Once the log shows **`Email OTP sent to`** instead of **`Email send error`**, SES is fixed.
