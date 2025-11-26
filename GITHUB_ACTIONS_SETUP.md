# GitHub Actions Setup Guide - Step by Step

This guide walks you through setting up GitHub Actions for infrastructure and backend deployment.

## 🎯 Setup Overview: Separate AWS Accounts

This guide is configured for **separate AWS accounts** for staging and production:

- **Staging Account** → Deploys when code is pushed to `staging` branch
- **Production Account** → Deploys when code is pushed to `main` branch

**Benefits of separate accounts:**

- ✅ Complete isolation between environments
- ✅ Enhanced security (different IAM policies)
- ✅ Separate billing and cost tracking
- ✅ Prevents accidental production changes
- ✅ Easier compliance and auditing

**What you'll set up:**

1. IAM users in each AWS account
2. GitHub Secrets for each account's credentials
3. CDK bootstrap in each account
4. Workflows that deploy to the correct account based on branch

---

## Prerequisites

Before starting, make sure you have:

- ✅ GitHub repository set up
- ✅ **Two separate AWS accounts** (one for staging, one for production)
- ✅ CDK infrastructure working locally
- ✅ Staging and production branches created

**Note:** This guide assumes you're using **separate AWS accounts** for staging and production, which is a security best practice.

---

## Step 1: Create Workflow Files

**✅ Already done!** The workflow files have been created:

- `.github/workflows/ci.yml` - Runs tests on PRs
- `.github/workflows/deploy-staging.yml` - Deploys to staging
- `.github/workflows/deploy-production.yml` - Deploys to production

**What these do:**

- **CI workflow**: Runs tests when you create a PR or push to staging/main
- **Staging workflow**: Deploys infrastructure when you push to `staging` branch
- **Production workflow**: Deploys infrastructure when you push to `main` branch (with approval)

---

## Step 2: Get Your AWS Account IDs

You'll need **both** AWS Account IDs (staging and production) for the secrets.

### 2.1 Get Staging Account ID

**Option 1: AWS Console**

1. Log into your **staging** AWS account
2. Click on your username (top right)
3. Account ID is displayed there

**Option 2: AWS CLI**

```bash
# Make sure you're authenticated to staging account
aws sts get-caller-identity --query Account --output text
```

**Save this value** as `STAGING_ACCOUNT_ID`

### 2.2 Get Production Account ID

**Option 1: AWS Console**

1. Log into your **production** AWS account
2. Click on your username (top right)
3. Account ID is displayed there

**Option 2: AWS CLI**

```bash
# Make sure you're authenticated to production account
aws sts get-caller-identity --query Account --output text
```

**Save this value** as `PRODUCTION_ACCOUNT_ID`

### Why Separate Accounts?

Using separate AWS accounts provides:

- ✅ **Complete isolation** - Staging issues can't affect production
- ✅ **Security** - Different IAM policies and access controls
- ✅ **Cost tracking** - Separate billing for each environment
- ✅ **Compliance** - Easier to meet regulatory requirements
- ✅ **Safety** - Prevents accidental production changes

---

## Step 3: Create IAM Users for GitHub Actions

You need AWS credentials in **each account** that GitHub Actions can use to deploy.

### 3.1 Create IAM User in Staging Account

**In your STAGING AWS account:**

1. Go to AWS Console → IAM → Users
2. Click "Create user"
3. Name: `github-actions-staging`
4. Click "Next"

**Attach Permissions:**

**Option A: Use AWS Managed Policy (Easier for staging)**

1. Select "Attach policies directly"
2. Search for and select: `PowerUserAccess`
3. Click "Next" → "Create user"

**Option B: Create Custom Policy (More secure)**

1. Go to IAM → Policies → Create policy
2. Click "JSON" tab
3. Paste this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "lambda:*",
        "apigateway:*",
        "dynamodb:*",
        "cognito-idp:*",
        "iam:*",
        "s3:*",
        "logs:*",
        "events:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["sts:GetCallerIdentity", "sts:AssumeRole"],
      "Resource": "*"
    }
  ]
}
```

4. Name it: `GitHubActionsStagingPolicy`
5. Create policy and attach to user

**Create Access Keys:**

1. Go to your IAM user → Security credentials tab
2. Click "Create access key"
3. Select "Application running outside AWS"
4. Click "Next"
5. **IMPORTANT**: Copy both:
   - **Access Key ID** → Save as `STAGING_ACCESS_KEY_ID`
   - **Secret Access Key** → Save as `STAGING_SECRET_ACCESS_KEY` (only shown once!)

### 3.2 Create IAM User in Production Account

**In your PRODUCTION AWS account:**

1. Go to AWS Console → IAM → Users
2. Click "Create user"
3. Name: `github-actions-production`
4. Click "Next"

**Attach Permissions:**

**For production, use Custom Policy (Recommended for security):**

1. Go to IAM → Policies → Create policy
2. Click "JSON" tab
3. Paste this policy (same as staging, but you can restrict further):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "lambda:*",
        "apigateway:*",
        "dynamodb:*",
        "cognito-idp:*",
        "iam:*",
        "s3:*",
        "logs:*",
        "events:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["sts:GetCallerIdentity", "sts:AssumeRole"],
      "Resource": "*"
    }
  ]
}
```

4. Name it: `GitHubActionsProductionPolicy`
5. Create policy and attach to user

**Create Access Keys:**

1. Go to your IAM user → Security credentials tab
2. Click "Create access key"
3. Select "Application running outside AWS"
4. Click "Next"
5. **IMPORTANT**: Copy both:
   - **Access Key ID** → Save as `PRODUCTION_ACCESS_KEY_ID`
   - **Secret Access Key** → Save as `PRODUCTION_SECRET_ACCESS_KEY` (only shown once!)

**Security Note:** For production, consider using IAM roles with cross-account access or more restrictive policies.

---

## Step 4: Add Secrets to GitHub

Now add your AWS credentials to GitHub Secrets.

### 4.1 Navigate to Secrets

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. In left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**

### 4.2 Add Staging Secrets

Add these secrets one by one:

**Secret 1: AWS_ACCESS_KEY_ID_STAGING**

- Name: `AWS_ACCESS_KEY_ID_STAGING`
- Value: Your staging IAM user's Access Key ID
- Click "Add secret"

**Secret 2: AWS_SECRET_ACCESS_KEY_STAGING**

- Name: `AWS_SECRET_ACCESS_KEY_STAGING`
- Value: Your staging IAM user's Secret Access Key
- Click "Add secret"

**Secret 3: AWS_ACCOUNT_ID_STAGING**

- Name: `AWS_ACCOUNT_ID_STAGING`
- Value: Your **staging** AWS Account ID (from Step 2.1)
- Click "Add secret"

### 4.3 Add Production Secrets

**Secret 4: AWS_ACCESS_KEY_ID_PRODUCTION**

- Name: `AWS_ACCESS_KEY_ID_PRODUCTION`
- Value: Your production IAM user's Access Key ID (from Step 3.2)
- Click "Add secret"

**Secret 5: AWS_SECRET_ACCESS_KEY_PRODUCTION**

- Name: `AWS_SECRET_ACCESS_KEY_PRODUCTION`
- Value: Your production IAM user's Secret Access Key (from Step 3.2)
- Click "Add secret"

**Secret 6: AWS_ACCOUNT_ID_PRODUCTION**

- Name: `AWS_ACCOUNT_ID_PRODUCTION`
- Value: Your **production** AWS Account ID (from Step 2.2)
- Click "Add secret"

### 4.4 Verify Secrets

You should now have these secrets:

- ✅ `AWS_ACCESS_KEY_ID_STAGING`
- ✅ `AWS_SECRET_ACCESS_KEY_STAGING`
- ✅ `AWS_ACCOUNT_ID_STAGING`
- ✅ `AWS_ACCESS_KEY_ID_PRODUCTION`
- ✅ `AWS_SECRET_ACCESS_KEY_PRODUCTION`
- ✅ `AWS_ACCOUNT_ID_PRODUCTION`

---

## Step 5: Bootstrap CDK in Both Accounts

CDK needs to be bootstrapped in each account and region before first deployment.

### 5.1 Bootstrap Staging Account

**Make sure you're authenticated to your STAGING AWS account:**

```bash
# Verify you're in staging account
aws sts get-caller-identity

# Should show your staging account ID

# Bootstrap staging account
cd infra
NOTES_APP_ENV=staging npx cdk bootstrap aws://STAGING_ACCOUNT_ID/us-east-2
```

Replace `STAGING_ACCOUNT_ID` with your actual staging AWS Account ID.

### 5.2 Bootstrap Production Account

**Switch to your PRODUCTION AWS account:**

```bash
# Switch AWS credentials to production account
# (Use your AWS CLI profile or environment variables)

# Verify you're in production account
aws sts get-caller-identity

# Should show your production account ID

# Bootstrap production account
cd infra
NOTES_APP_ENV=production npx cdk bootstrap aws://PRODUCTION_ACCOUNT_ID/us-west-2
```

Replace `PRODUCTION_ACCOUNT_ID` with your actual production AWS Account ID.

**Note:**

- If you've already deployed manually, CDK is likely already bootstrapped. You can skip this step if deployments worked before.
- Each account needs to be bootstrapped separately.
- Make sure you're authenticated to the correct account before bootstrapping.

---

## Step 6: Set Up Production Approval (Optional but Recommended)

For production deployments, you can require manual approval.

### 6.1 Create Production Environment

1. Go to GitHub repository → **Settings**
2. In left sidebar: **Environments**
3. Click **New environment**
4. Name: `production`
5. Click **Configure environment**

### 6.2 Add Required Reviewers (Optional)

1. Under "Required reviewers", click **Add reviewer**
2. Add yourself (or team members)
3. Save protection rules

**What this does:**

- When code is pushed to `main`, the workflow will pause
- You'll see "Review deployments" button in GitHub
- After approval, deployment continues

---

## Step 7: Test the Setup

Now let's test that everything works!

### 7.1 Test CI Workflow (No Deployment)

1. Create a test branch:

   ```bash
   git checkout -b test/github-actions-setup
   ```

2. Make a small change (or just add a comment):

   ```bash
   # Edit any file in infra/ or backend/
   echo "# Test" >> infra/README.md
   ```

3. Commit and push:

   ```bash
   git add .
   git commit -m "Test GitHub Actions CI"
   git push origin test/github-actions-setup
   ```

4. Create a Pull Request to `staging` branch

5. **Check GitHub Actions:**
   - Go to your repo → **Actions** tab
   - You should see "CI" workflow running
   - It should complete successfully (green checkmark)

### 7.2 Test Staging Deployment

**⚠️ Important:** Only do this if you're ready to deploy to staging!

1. Merge your test PR to `staging` (or push directly to staging):

   ```bash
   git checkout staging
   git merge test/github-actions-setup
   git push origin staging
   ```

2. **Check GitHub Actions:**

   - Go to **Actions** tab
   - You should see "Deploy to Staging" workflow running
   - Watch it deploy your infrastructure

3. **Verify deployment:**
   - Check AWS Console to see if resources were created/updated
   - Check CloudFormation stacks: `NotesAppStackStaging`

### 7.3 Test Production Deployment (After Staging Works)

1. Merge `staging` → `main`:

   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```

2. **If you set up approval:**

   - Go to **Actions** tab
   - You'll see "Deploy to Production" workflow
   - It will show "Waiting for approval"
   - Click "Review deployments" → Approve

3. **Watch deployment:**
   - After approval, deployment continues
   - Verify in AWS Console: `NotesAppStackProduction`

---

## Step 8: Verify Everything Works

### Checklist

- [ ] CI workflow runs on PRs
- [ ] Staging deployment works when pushing to `staging`
- [ ] Production deployment works when pushing to `main`
- [ ] Production requires approval (if configured)
- [ ] Infrastructure deploys correctly in both environments
- [ ] Backend (Lambda) functions are deployed

---

## Troubleshooting

### Issue: "AWS credentials not found"

**Solution:**

- Check that secrets are added correctly in GitHub
- Verify secret names match exactly (case-sensitive)
- Make sure you're using the right secret names in workflows

### Issue: "CDK bootstrap required"

**Solution:**

- Run `cdk bootstrap` for the region (see Step 5)
- Make sure you use the correct account ID and region

### Issue: "Permission denied" errors

**Solution:**

- Check IAM user has correct permissions
- Verify the IAM policy includes all necessary actions
- Try using `PowerUserAccess` policy temporarily to test

### Issue: "Workflow not triggering"

**Solution:**

- Check that workflow files are in `.github/workflows/`
- Verify branch names match (`staging`, `main`)
- Check path filters - make sure you're changing files in `infra/` or `backend/`
- Push a change to trigger the workflow

### Issue: "Environment variable not set"

**Solution:**

- Verify `NOTES_APP_ENV` is set in workflow `env:` section
- Check that `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` are set
- Make sure secrets are named correctly

---

## Understanding the Workflows

### CI Workflow (`ci.yml`)

**When it runs:**

- On pull requests to `staging` or `main`
- On pushes to `staging` or `main` (if infra/backend files change)

**What it does:**

- Installs dependencies
- Builds TypeScript
- Runs tests
- **Does NOT deploy** - just validates code

### Staging Deployment (`deploy-staging.yml`)

**When it runs:**

- On push to `staging` branch
- Only if files in `infra/` or `backend/` change

**What it does:**

- Installs dependencies
- Builds TypeScript
- Configures AWS credentials (staging)
- Deploys CDK stack to staging (us-east-2)

### Production Deployment (`deploy-production.yml`)

**When it runs:**

- On push to `main` branch
- Only if files in `infra/` or `backend/` change
- **Requires approval** (if environment is configured)

**What it does:**

- Installs dependencies
- Builds TypeScript
- Configures AWS credentials (production)
- Waits for approval (if configured)
- Deploys CDK stack to production (us-west-2)

---

## Next Steps

1. **Monitor deployments:**

   - Check GitHub Actions tab regularly
   - Set up notifications for failed workflows

2. **Add more checks:**

   - Add linting to CI workflow
   - Add security scanning
   - Add deployment notifications

3. **Optimize:**

   - Add caching for faster builds
   - Add deployment status badges to README

4. **Document:**
   - Document your deployment process
   - Add runbooks for common issues

---

## Quick Reference

### Manual Deployment (Still Works)

You can still deploy manually if needed:

```bash
# Staging
cd infra
NOTES_APP_ENV=staging cdk deploy

# Production
cd infra
NOTES_APP_ENV=production cdk deploy
```

### View Workflow Runs

- Go to: `https://github.com/YOUR_USERNAME/notes-app/actions`
- Click on a workflow to see details
- Click on a run to see logs

### View Secrets

- Go to: Repository → Settings → Secrets and variables → Actions

---

## Summary

You've set up:

1. ✅ **CI workflow** - Tests code on PRs
2. ✅ **Staging deployment** - Auto-deploys on push to `staging`
3. ✅ **Production deployment** - Auto-deploys on push to `main` (with approval)

**The flow:**

```
Feature branch → PR → CI runs → Merge to staging →
Staging deploys → Test → Merge to main →
Production deploys (with approval)
```

Your infrastructure and backend are now automatically deployed via GitHub Actions! 🚀
