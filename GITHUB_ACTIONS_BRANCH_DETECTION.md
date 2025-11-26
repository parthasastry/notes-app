# How GitHub Actions Knows: Staging vs Production

## The Simple Answer

**GitHub Actions determines the environment based on which branch triggered the workflow.**

- Push to `staging` branch → Deploy to **staging** environment
- Push to `main` branch → Deploy to **production** environment

---

## How It Works: Branch-Based Deployment

### The Branch Strategy

```
main branch     → Production environment (us-west-2)
staging branch  → Staging environment (us-east-2)
```

### How GitHub Actions Detects the Branch

When you push code, GitHub Actions knows:

- **Which branch** was pushed to
- **Which workflow** should run
- **What environment** to deploy to

---

## Method 1: Separate Workflows (Recommended)

**Create two separate workflow files** - one for staging, one for production.

### Staging Workflow

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

# Only runs when code is pushed to staging branch
on:
  push:
    branches: [staging]
    paths:
      - "infra/**"
      - "backend/**"

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: infra/package-lock.json

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_STAGING }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_STAGING }}
          aws-region: us-east-2 # Staging region

      - name: Install dependencies
        run: |
          cd infra
          npm ci

      - name: Build CDK
        run: |
          cd infra
          npm run build

      - name: Deploy to staging
        env:
          NOTES_APP_ENV: staging # ← This tells CDK to deploy to staging
          CDK_DEFAULT_ACCOUNT: ${{ secrets.AWS_ACCOUNT_ID }}
          CDK_DEFAULT_REGION: us-east-2
        run: |
          cd infra
          npx cdk deploy --all --require-approval never
```

### Production Workflow

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

# Only runs when code is pushed to main branch
on:
  push:
    branches: [main]
    paths:
      - "infra/**"
      - "backend/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production # ← This adds approval gate for production

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: infra/package-lock.json

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PRODUCTION }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PRODUCTION }}
          aws-region: us-west-2 # Production region

      - name: Install dependencies
        run: |
          cd infra
          npm ci

      - name: Build CDK
        run: |
          cd infra
          npm run build

      - name: Deploy to production
        env:
          NOTES_APP_ENV: production # ← This tells CDK to deploy to production
          CDK_DEFAULT_ACCOUNT: ${{ secrets.AWS_ACCOUNT_ID }}
          CDK_DEFAULT_REGION: us-west-2
        run: |
          cd infra
          npx cdk deploy --all --require-approval never
```

**Key Points:**

- ✅ Each workflow only triggers on its specific branch
- ✅ Different AWS credentials for staging vs production
- ✅ Different regions (us-east-2 vs us-west-2)
- ✅ Production has approval gate (`environment: production`)

---

## Method 2: Single Workflow with Branch Detection

**One workflow file that detects the branch and deploys accordingly.**

```yaml
# .github/workflows/deploy.yml
name: Deploy Infrastructure

on:
  push:
    branches: [staging, main]
    paths:
      - "infra/**"
      - "backend/**"

jobs:
  deploy:
    runs-on: ubuntu-latest

    # Determine environment based on branch
    steps:
      - uses: actions/checkout@v4

      - name: Determine environment
        id: env
        run: |
          if [ "${{ github.ref }}" == "refs/heads/main" ]; then
            echo "environment=production" >> $GITHUB_OUTPUT
            echo "region=us-west-2" >> $GITHUB_OUTPUT
            echo "aws_key=AWS_ACCESS_KEY_ID_PRODUCTION" >> $GITHUB_OUTPUT
            echo "aws_secret=AWS_SECRET_ACCESS_KEY_PRODUCTION" >> $GITHUB_OUTPUT
          else
            echo "environment=staging" >> $GITHUB_OUTPUT
            echo "region=us-east-2" >> $GITHUB_OUTPUT
            echo "aws_key=AWS_ACCESS_KEY_ID_STAGING" >> $GITHUB_OUTPUT
            echo "aws_secret=AWS_SECRET_ACCESS_KEY_STAGING" >> $GITHUB_OUTPUT
          fi

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: infra/package-lock.json

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets[steps.env.outputs.aws_key] }}
          aws-secret-access-key: ${{ secrets[steps.env.outputs.aws_secret] }}
          aws-region: ${{ steps.env.outputs.region }}

      - name: Install dependencies
        run: |
          cd infra
          npm ci

      - name: Build CDK
        run: |
          cd infra
          npm run build

      - name: Deploy
        env:
          NOTES_APP_ENV: ${{ steps.env.outputs.environment }}
          CDK_DEFAULT_ACCOUNT: ${{ secrets.AWS_ACCOUNT_ID }}
          CDK_DEFAULT_REGION: ${{ steps.env.outputs.region }}
        run: |
          cd infra
          npx cdk deploy --all --require-approval never
```

**Key Points:**

- ✅ One workflow file for both environments
- ✅ Uses `github.ref` to detect branch
- ✅ Sets environment variables dynamically
- ⚠️ More complex, harder to add approval gates per environment

---

## Understanding `github.ref`

GitHub Actions provides context variables that tell you about the event:

```yaml
# Examples of github.ref values:
github.ref == "refs/heads/main"      # Push to main branch
github.ref == "refs/heads/staging"   # Push to staging branch
github.ref == "refs/heads/feature/x"  # Push to feature branch
```

**Common context variables:**

```yaml
github.ref          # Full ref: "refs/heads/main"
github.ref_name     # Branch name: "main"
github.base_ref     # Base branch (for PRs): "staging"
github.head_ref     # Head branch (for PRs): "feature/x"
```

---

## Complete Example: Your Setup

Based on your deployment strategy, here's the recommended setup:

### File Structure

```
.github/workflows/
├── ci.yml                    # Run tests on PRs
├── deploy-staging.yml        # Deploy to staging (on push to staging)
└── deploy-production.yml     # Deploy to production (on push to main)
```

### CI Workflow (Tests Only)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [staging, main]
  push:
    branches: [staging, main]

jobs:
  test-infra:
    runs-on: ubuntu-latest
    if: contains(github.event.pull_request.changed_files, 'infra/') || github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: infra/package-lock.json
      - run: |
          cd infra
          npm ci
          npm run build
          npm test
```

### Staging Deployment

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [staging]
    paths:
      - "infra/**"
      - "backend/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: infra/package-lock.json

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_STAGING }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_STAGING }}
          aws-region: us-east-2

      - name: Install and build
        run: |
          cd infra
          npm ci
          npm run build

      - name: Deploy infrastructure
        env:
          NOTES_APP_ENV: staging
          CDK_DEFAULT_ACCOUNT: ${{ secrets.AWS_ACCOUNT_ID }}
          CDK_DEFAULT_REGION: us-east-2
        run: |
          cd infra
          npx cdk deploy --all --require-approval never
```

### Production Deployment (With Approval)

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]
    paths:
      - "infra/**"
      - "backend/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production # ← Requires manual approval

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: infra/package-lock.json

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PRODUCTION }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PRODUCTION }}
          aws-region: us-west-2

      - name: Install and build
        run: |
          cd infra
          npm ci
          npm run build

      - name: Deploy infrastructure
        env:
          NOTES_APP_ENV: production
          CDK_DEFAULT_ACCOUNT: ${{ secrets.AWS_ACCOUNT_ID }}
          CDK_DEFAULT_REGION: us-west-2
        run: |
          cd infra
          npx cdk deploy --all --require-approval never
```

---

## How the Flow Works

### Scenario 1: Deploy to Staging

```
1. Developer merges feature branch → staging
   git checkout staging
   git merge feature/my-feature
   git push origin staging

2. GitHub detects push to staging branch

3. GitHub Actions triggers deploy-staging.yml workflow

4. Workflow runs:
   - Sets NOTES_APP_ENV=staging
   - Uses staging AWS credentials
   - Deploys to us-east-2 region
   - CDK creates/updates NotesAppStackStaging

5. Deployment completes ✅
```

### Scenario 2: Deploy to Production

```
1. Developer merges staging → main
   git checkout main
   git merge staging
   git push origin main

2. GitHub detects push to main branch

3. GitHub Actions triggers deploy-production.yml workflow

4. Workflow waits for approval (if configured)
   - Shows "Review deployments" button in GitHub
   - Someone must approve before deployment

5. After approval, workflow runs:
   - Sets NOTES_APP_ENV=production
   - Uses production AWS credentials
   - Deploys to us-west-2 region
   - CDK creates/updates NotesAppStackProduction

6. Deployment completes ✅
```

---

## Key Variables That Control Deployment

### 1. Branch Detection (Automatic)

```yaml
on:
  push:
    branches: [staging] # Only runs on staging branch
```

or

```yaml
on:
  push:
    branches: [main] # Only runs on main branch
```

### 2. Environment Variable (Tells CDK Which Environment)

```yaml
env:
  NOTES_APP_ENV: staging # or "production"
```

This is what your CDK code reads to determine:

- Which `.env` file to load (`.env.staging` vs `.env.production`)
- Which stack name to use
- Which resources to create/update

### 3. AWS Region (Different Per Environment)

```yaml
aws-region: us-east-2  # Staging
aws-region: us-west-2  # Production
```

### 4. AWS Credentials (Different Per Environment)

```yaml
# Staging
aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_STAGING }}
aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_STAGING }}

# Production
aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PRODUCTION }}
aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PRODUCTION }}
```

---

## Setting Up Approval Gates for Production

### Step 1: Create Environment in GitHub

1. Go to your GitHub repository
2. Settings → Environments
3. Click "New environment"
4. Name it: `production`
5. Add required reviewers (optional)
6. Save

### Step 2: Reference Environment in Workflow

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production # ← This enables approval gate
    steps:
      # ... deployment steps
```

### Step 3: How It Works

When workflow runs:

1. Workflow starts
2. Reaches the job with `environment: production`
3. **Pauses and waits for approval**
4. Shows "Review deployments" button in GitHub UI
5. After approval, continues with deployment

---

## Secrets You Need to Set Up

### In GitHub: Settings → Secrets and variables → Actions

**Staging Secrets:**

- `AWS_ACCESS_KEY_ID_STAGING`
- `AWS_SECRET_ACCESS_KEY_STAGING`
- `AWS_ACCOUNT_ID` (can be shared)

**Production Secrets:**

- `AWS_ACCESS_KEY_ID_PRODUCTION`
- `AWS_SECRET_ACCESS_KEY_PRODUCTION`
- `AWS_ACCOUNT_ID` (can be shared)

---

## Summary

**How GitHub Actions knows staging vs production:**

1. **Branch triggers workflow** - `staging` branch → staging workflow, `main` branch → production workflow
2. **Workflow sets environment variable** - `NOTES_APP_ENV=staging` or `NOTES_APP_ENV=production`
3. **CDK reads environment variable** - Uses it to load correct `.env` file and deploy to correct stack
4. **Different AWS credentials** - Staging and production use separate credentials
5. **Different regions** - Staging (us-east-2), Production (us-west-2)

**The key is:** The branch that triggers the push determines which workflow runs, which sets the environment, which tells CDK where to deploy!

---

## Quick Reference

| Branch    | Workflow File           | Environment  | Region      | Credentials    |
| --------- | ----------------------- | ------------ | ----------- | -------------- |
| `staging` | `deploy-staging.yml`    | `staging`    | `us-east-2` | `*_STAGING`    |
| `main`    | `deploy-production.yml` | `production` | `us-west-2` | `*_PRODUCTION` |
