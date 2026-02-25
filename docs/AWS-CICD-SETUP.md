# Connect GitHub and set up CI/CD for Elastic Beanstalk

You can use either **AWS CodePipeline** (all in AWS) or **GitHub Actions** (in GitHub). Both deploy your app when you push to `main`.

---

## Option A: AWS CodePipeline (GitHub → CodeBuild → EB)

Everything runs in AWS. Push to GitHub triggers the pipeline; CodeBuild creates the zip; Elastic Beanstalk deploys.

### 1. Create the pipeline

1. In **AWS Console** go to **CodePipeline** → **Pipelines** → **Create pipeline**.
2. **Pipeline name:** `24digi-backend-pipeline`.
3. **Service role:** New or existing. Click **Next**.

### 2. Add source stage (GitHub)

1. **Source provider:** **GitHub (Version 2)**.
2. **Connection:** If you see “Connect to GitHub”, click it:
   - Choose **Connect to GitHub**.
   - Authorize AWS in the popup and pick your GitHub account.
   - Select **Only select repositories** → choose **otahir-21/24digiBackend**.
   - Name the connection (e.g. `github-24digi`) → **Connect**.
3. Back in the pipeline:
   - **Repository:** `otahir-21/24digiBackend`.
   - **Branch:** `main`.
   - **Output artifact format:** CodePipeline default.
4. Click **Next**.

### 3. Add build stage (CodeBuild)

1. **Build provider:** **AWS CodeBuild**.
2. **Region:** Same as your EB (e.g. `eu-north-1`).
3. **Create project** (or use existing):
   - **Project name:** `24digi-backend-build`.
   - **Environment:** Managed image, **Amazon Linux 2**, **Standard**, **Node.js 20**.
   - **Buildspec:** **Use a buildspec file** → leave name as `buildspec.yml`.
   - **Artifacts:** **CodePipeline** (artifact from this build will go to deploy).
4. Click **Next**.

### 4. Add deploy stage (Elastic Beanstalk)

1. **Deploy provider:** **AWS Elastic Beanstalk**.
2. **Application name:** `24digi-backend`.
3. **Environment name:** `24digi-backend-prod`.
4. **Input artifact:** Select the **Build** stage output artifact (e.g. `BuildArtifact`).
5. **Artifact name:** The build stage must output a single zip. The project uses `buildspec.yml` and outputs `deploy.zip`. If CodeBuild is configured to produce one artifact, select that.
6. Click **Next** → **Create pipeline**.

### 5. Fix artifact for EB (if needed)

Elastic Beanstalk expects a **single zip** as the deploy artifact. The repo’s `buildspec.yml` produces `deploy.zip`. In CodeBuild project:

- **Artifacts** → **Primary artifact** → **Artifacts** = `deploy.zip` (or the name you set in buildspec).

If the deploy step fails with “invalid artifact”, in the **Deploy** stage check that the **Input artifact** is the Build output and that the Build project’s artifact is `deploy.zip`.

### 6. Trigger

Push to `main` on GitHub. The pipeline will run and deploy to `24digi-backend-prod`.

---

## Option B: GitHub Actions (recommended, simpler)

Uses a workflow in your repo. You only add AWS credentials as GitHub secrets.

### 1. Create IAM user for deployments (if you don’t have one)

1. **IAM** → **Users** → **Create user** (e.g. `github-actions-24digi`).
2. **Attach policies:** `AWSElasticBeanstalkFullAccess` (or a custom policy with only the EB deploy permissions you need).
3. **Create access key** → **Application running outside AWS** → copy **Access key ID** and **Secret access key**.

### 2. Add GitHub secrets

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret** for:
   - `AWS_ACCESS_KEY_ID` = access key from step 1.
   - `AWS_SECRET_ACCESS_KEY` = secret key from step 1.

### 3. Workflow and region

The workflow file is already in the repo: **`.github/workflows/deploy-aws-eb.yml`**.

It uses:
- **Application:** `24digi-backend`
- **Environment:** `24digi-backend-prod`
- **Region:** `eu-north-1`

If your EB app or region is different, edit the workflow and change `application_name`, `environment_name`, and `region`.

### 4. Deploy

Push (or merge) to **`main`**. The workflow runs and deploys to Elastic Beanstalk. Check the **Actions** tab for logs.

---

## After first deploy

- API base URL: **https://24digi-backend-prod.eba-uixgxim5.eu-north-1.elasticbeanstalk.com**
- Health: **GET** `/health`
- Env vars (MongoDB, JWT, etc.) are set in **Elastic Beanstalk** → **Configuration** → **Environment properties** (you already set them in Step 5).

For future work: push to `main` and either CodePipeline or GitHub Actions will deploy automatically.
