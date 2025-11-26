# GitHub Actions Guide for Notes App

## What is GitHub Actions?

**GitHub Actions** is a CI/CD platform built into GitHub that automates your software workflows. Think of it as a robot that watches your repository and automatically runs tasks when certain events happen (like pushing code or creating a PR).

### Key Concepts

1. **Workflow**: A file that defines when and how to run automation
2. **Event**: Something that happens in your repo (push, PR, merge, etc.)
3. **Job**: A set of steps that run on the same machine
4. **Step**: A single task (install dependencies, run tests, deploy, etc.)
5. **Runner**: The virtual machine that executes your workflow

---

## How GitHub Actions Works

### Basic Flow

```
Event Happens (push/PR)
    ↓
GitHub detects event
    ↓
Finds matching workflow file
    ↓
Starts a runner (virtual machine)
    ↓
Runs jobs and steps
    ↓
Reports results (success/failure)
```

### Where Workflows Live

Workflows are YAML files stored in:

```
.github/workflows/
├── ci.yml              # Run tests
├── deploy-infra.yml    # Deploy infrastructure
└── deploy-frontend.yml # Deploy frontend
```

---

## GitHub Actions for Your Notes App

Your app has three parts that need different deployment strategies:

1. **Infrastructure** (CDK) - Deploys AWS resources
2. **Backend** (Lambda) - Deployed via CDK (part of infrastructure)
3. **Frontend** (React) - Builds and deploys static files

---

## Part 1: Infrastructure (CDK)

### What It Does

- Deploys AWS resources (DynamoDB, Lambda, API Gateway, Cognito)
- Uses AWS CDK (Cloud Development Kit)
- Environment-aware (staging vs production)

### How It Works in GitHub Actions

**Step-by-step process:**

1. **Trigger**: Code pushed to `staging` or `main` branch
2. **Checkout**: Get the code from GitHub
3. **Setup**: Install Node.js
4. **Configure AWS**: Set up AWS credentials
5. **Install**: Run `npm install` in `infra/` directory
6. **Deploy**: Run `cdk deploy` with environment variable

### Example Workflow

```yaml
# .github/workflows/deploy-infra-staging.yml
name: Deploy Infrastructure to Staging

on:
  push:
    branches: [staging]
    paths:
      - "infra/**" # Only trigger if infra code changes
      - ".github/workflows/deploy-infra-staging.yml"

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      # Step 1: Get code from GitHub
      - name: Checkout code
        uses: actions/checkout@v4

      # Step 2: Install Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: infra/package-lock.json

      # Step 3: Configure AWS credentials
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_STAGING }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_STAGING }}
          aws-region: us-east-2

      # Step 4: Install dependencies
      - name: Install dependencies
        run: |
          cd infra
          npm ci  # ci is faster and more reliable than install

      # Step 5: Build TypeScript
      - name: Build CDK
        run: |
          cd infra
          npm run build

      # Step 6: Deploy to staging
      - name: Deploy CDK stack
        env:
          NOTES_APP_ENV: staging
          CDK_DEFAULT_ACCOUNT: ${{ secrets.AWS_ACCOUNT_ID }}
          CDK_DEFAULT_REGION: us-east-2
        run: |
          cd infra
          npx cdk deploy --all --require-approval never
```

### Key Points for Infrastructure

- **Environment variable**: `NOTES_APP_ENV=staging` or `production`
- **AWS credentials**: Stored as GitHub Secrets (never in code!)
- **Region**: Different for staging (us-east-2) vs production (us-west-2)
- **Path filter**: Only runs when infrastructure code changes

---

## Part 2: Backend (Lambda Functions)

### What It Does

- Lambda functions are deployed **as part of CDK**
- CDK packages Lambda code and deploys it
- No separate deployment needed!

### How It Works

**Important**: Lambda deployment is handled by CDK automatically. When you deploy infrastructure, CDK:

1. Packages Lambda code from `backend/lambda/`
2. Uploads to S3 (or uses inline code)
3. Creates/updates Lambda functions
4. Updates API Gateway routes

### Why No Separate Workflow?

CDK handles Lambda deployment because:

- Lambda code is bundled with infrastructure definition
- CDK knows where Lambda code lives
- One deployment command does everything

### Example: How CDK Deploys Lambda

In your CDK code (TypeScript), you probably have something like:

```typescript
// infra/lib/lambda-stack.ts
const notesApiFunction = new Function(this, "NotesApiFunction", {
  runtime: Runtime.NODEJS_20_X,
  handler: "index.handler",
  code: Code.fromAsset("../backend/lambda/notes-api"), // CDK packages this
  // ... other config
});
```

When you run `cdk deploy`, CDK:

1. Reads this code
2. Packages `../backend/lambda/notes-api/`
3. Uploads to AWS
4. Creates Lambda function

### If You Need Separate Backend Workflow

**Only if you want to:**

- Test Lambda functions separately
- Lint Lambda code
- Run unit tests for Lambda

Example:

```yaml
# .github/workflows/test-backend.yml
name: Test Backend

on:
  pull_request:
    paths:
      - "backend/**"

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: |
          cd backend/lambda/notes-api
          npm ci

      - name: Run tests
        run: |
          cd backend/lambda/notes-api
          npm test  # If you add tests

      - name: Lint
        run: |
          cd backend/lambda/notes-api
          npm run lint  # If you add linting
```

**But deployment still happens via CDK!**

---

## Part 3: Frontend (React + Vite)

### What It Does

- Builds React app into static files
- Deploys to hosting (S3 + CloudFront, or Amplify)
- Environment-aware (different API URLs for staging/production)

### How It Works in GitHub Actions

**Step-by-step process:**

1. **Trigger**: Code pushed to `staging` or `main` branch
2. **Checkout**: Get the code
3. **Setup**: Install Node.js
4. **Install**: Run `npm install` in `frontend/` directory
5. **Build**: Run `npm run build` (creates `dist/` folder)
6. **Deploy**: Upload `dist/` to S3/CloudFront or Amplify

### Option A: Deploy to S3 + CloudFront

```yaml
# .github/workflows/deploy-frontend-staging.yml
name: Deploy Frontend to Staging

on:
  push:
    branches: [staging]
    paths:
      - "frontend/**"
      - ".github/workflows/deploy-frontend-staging.yml"

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Build frontend
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL_STAGING }}
          VITE_USER_POOL_ID: ${{ secrets.VITE_USER_POOL_ID_STAGING }}
          VITE_USER_POOL_CLIENT_ID: ${{ secrets.VITE_USER_POOL_CLIENT_ID_STAGING }}
          VITE_REGION: us-east-2
        run: |
          cd frontend
          npm run build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_STAGING }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_STAGING }}
          aws-region: us-east-2

      - name: Deploy to S3
        run: |
          aws s3 sync frontend/dist/ s3://${{ secrets.S3_BUCKET_STAGING }} --delete

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID_STAGING }} \
            --paths "/*"
```

### Option B: Deploy to AWS Amplify (Easier)

If you use AWS Amplify, you can:

1. Connect GitHub repo in Amplify Console
2. Configure build settings
3. Amplify auto-deploys on push

**Or use GitHub Actions to trigger Amplify:**

```yaml
# .github/workflows/deploy-frontend-amplify.yml
name: Deploy Frontend via Amplify

on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Amplify deployment
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_STAGING }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_STAGING }}
          aws-region: us-east-2

      - name: Start Amplify job
        run: |
          aws amplify start-job \
            --app-id ${{ secrets.AMPLIFY_APP_ID_STAGING }} \
            --branch-name staging \
            --job-type RELEASE
```

### Key Points for Frontend

- **Build-time variables**: Use `VITE_*` prefix for Vite env vars
- **Environment-specific**: Different API URLs for staging/production
- **Cache invalidation**: Clear CloudFront cache after deployment
- **Build output**: `frontend/dist/` contains static files

---

## Complete Workflow Examples

### Example 1: CI Workflow (Tests on PRs)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [staging, main]
  push:
    branches: [staging, main]

jobs:
  # Test Infrastructure
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

  # Test Frontend
  test-frontend:
    runs-on: ubuntu-latest
    if: contains(github.event.pull_request.changed_files, 'frontend/') || github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json
      - run: |
          cd frontend
          npm ci
          npm run lint
          npm run build
```

### Example 2: Deploy to Staging (All Components)

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [staging]

jobs:
  deploy-infra:
    runs-on: ubuntu-latest
    if: contains(github.event.head_commit.modified, 'infra/') || contains(github.event.head_commit.added, 'infra/')
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: infra/package-lock.json
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_STAGING }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_STAGING }}
          aws-region: us-east-2
      - run: |
          cd infra
          npm ci
          npm run build
          NOTES_APP_ENV=staging npx cdk deploy --all --require-approval never

  deploy-frontend:
    runs-on: ubuntu-latest
    if: contains(github.event.head_commit.modified, 'frontend/') || contains(github.event.head_commit.added, 'frontend/')
    needs: deploy-infra # Wait for infra to deploy first (to get API URLs)
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json
      - run: |
          cd frontend
          npm ci
          npm run build
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_STAGING }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_STAGING }}
          aws-region: us-east-2
      - run: |
          aws s3 sync frontend/dist/ s3://${{ secrets.S3_BUCKET_STAGING }} --delete
```

### Example 3: Deploy to Production (With Approval)

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-infra:
    runs-on: ubuntu-latest
    environment: production # This requires manual approval
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: infra/package-lock.json
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PRODUCTION }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PRODUCTION }}
          aws-region: us-west-2
      - run: |
          cd infra
          npm ci
          npm run build
          NOTES_APP_ENV=production npx cdk deploy --all --require-approval never

  deploy-frontend:
    runs-on: ubuntu-latest
    environment: production # This requires manual approval
    needs: deploy-infra
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json
      - run: |
          cd frontend
          npm ci
          npm run build
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PRODUCTION }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PRODUCTION }}
          aws-region: us-west-2
      - run: |
          aws s3 sync frontend/dist/ s3://${{ secrets.S3_BUCKET_PRODUCTION }} --delete
```

---

## Understanding Workflow Components

### 1. Triggers (`on:`)

**When the workflow runs:**

```yaml
on:
  push:
    branches: [staging, main] # On push to these branches
  pull_request:
    branches: [staging] # On PR to staging
  workflow_dispatch: # Manual trigger
```

**Path filters (only run if specific files change):**

```yaml
on:
  push:
    branches: [staging]
    paths:
      - "infra/**" # Only if infra/ changes
      - "frontend/**" # Only if frontend/ changes
```

### 2. Jobs

**Jobs run in parallel by default:**

```yaml
jobs:
  job1:
    runs-on: ubuntu-latest
    steps: [...]

  job2:
    runs-on: ubuntu-latest
    steps: [...]
```

**Jobs can depend on each other:**

```yaml
jobs:
  build:
    steps: [...]

  deploy:
    needs: build # Wait for build to finish
    steps: [...]
```

### 3. Steps

**Steps run sequentially:**

```yaml
steps:
  - name: Step 1
    run: echo "First"

  - name: Step 2
    run: echo "Second" # Runs after Step 1
```

**Reusable actions:**

```yaml
steps:
  - uses: actions/checkout@v4 # Reusable action
  - uses: actions/setup-node@v4 # Reusable action
  - run: npm install # Custom command
```

### 4. Environment Variables

**Set in workflow:**

```yaml
env:
  NODE_ENV: production
  NOTES_APP_ENV: staging
```

**Use secrets:**

```yaml
env:
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
```

**Use in commands:**

```yaml
run: |
  echo "Environment: ${{ env.NOTES_APP_ENV }}"
  npm run build
```

### 5. Secrets

**Where to add secrets:**

1. Go to GitHub repo
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add name and value

**Common secrets you'll need:**

```
AWS_ACCESS_KEY_ID_STAGING
AWS_SECRET_ACCESS_KEY_STAGING
AWS_ACCESS_KEY_ID_PRODUCTION
AWS_SECRET_ACCESS_KEY_PRODUCTION
AWS_ACCOUNT_ID
S3_BUCKET_STAGING
S3_BUCKET_PRODUCTION
CLOUDFRONT_DISTRIBUTION_ID_STAGING
CLOUDFRONT_DISTRIBUTION_ID_PRODUCTION
VITE_API_URL_STAGING
VITE_API_URL_PRODUCTION
```

---

## Deployment Flow Diagram

```
Developer pushes to feature branch
    ↓
Create PR to staging
    ↓
CI runs (tests, linting)
    ↓
PR approved and merged to staging
    ↓
GitHub Actions triggers:
    ├─ Deploy Infrastructure (CDK)
    │   └─ Deploys Lambda (backend) automatically
    └─ Deploy Frontend (build + upload)
    ↓
Test in staging
    ↓
Merge staging → main
    ↓
GitHub Actions triggers:
    ├─ Wait for approval (manual)
    ├─ Deploy Infrastructure to production
    └─ Deploy Frontend to production
```

---

## Key Differences: Infrastructure vs Backend vs Frontend

| Aspect          | Infrastructure       | Backend                | Frontend            |
| --------------- | -------------------- | ---------------------- | ------------------- |
| **What**        | AWS resources (CDK)  | Lambda functions       | React app           |
| **Deployment**  | `cdk deploy`         | Via CDK (automatic)    | Build + upload      |
| **Location**    | `infra/`             | `backend/lambda/`      | `frontend/`         |
| **Build**       | TypeScript compile   | None (packaged by CDK) | `vite build`        |
| **Output**      | CloudFormation stack | Lambda function        | `dist/` folder      |
| **Environment** | `NOTES_APP_ENV`      | Same as infra          | Build-time env vars |

---

## Best Practices

### 1. Use Path Filters

Only run workflows when relevant files change:

```yaml
on:
  push:
    branches: [staging]
    paths:
      - "infra/**"
```

### 2. Cache Dependencies

Speed up workflows by caching npm:

```yaml
- uses: actions/setup-node@v4
  with:
    cache: "npm"
    cache-dependency-path: infra/package-lock.json
```

### 3. Use `npm ci` Instead of `npm install`

- Faster
- More reliable (uses exact versions from lock file)
- Better for CI/CD

### 4. Separate Secrets for Staging/Production

- `AWS_ACCESS_KEY_ID_STAGING`
- `AWS_ACCESS_KEY_ID_PRODUCTION`

### 5. Use Approval Gates for Production

```yaml
jobs:
  deploy:
    environment: production # Requires approval
```

### 6. Use `--require-approval never` for CDK

Prevents workflow from hanging:

```yaml
run: npx cdk deploy --all --require-approval never
```

### 7. Add Status Badges

Show workflow status in README:

```markdown
![CI](https://github.com/yourusername/notes-app/workflows/CI/badge.svg)
```

---

## Common Issues and Solutions

### Issue 1: "AWS credentials not found"

**Solution**: Add secrets in GitHub Settings → Secrets

### Issue 2: "CDK bootstrap required"

**Solution**: Bootstrap CDK once manually, then workflows work:

```bash
cd infra
cdk bootstrap aws://ACCOUNT-ID/us-east-2
```

### Issue 3: "Frontend build fails - env vars missing"

**Solution**: Add `VITE_*` env vars as secrets and use in workflow

### Issue 4: "Workflow runs on every push (even docs)"

**Solution**: Use path filters:

```yaml
paths:
  - "infra/**"
  - "frontend/**"
```

### Issue 5: "Deployment takes too long"

**Solution**:

- Cache dependencies
- Use `npm ci` instead of `npm install`
- Only deploy changed components

---

## Next Steps

1. **Create `.github/workflows/` directory**
2. **Start with CI workflow** (just tests, no deployment)
3. **Add staging deployment** (infra + frontend)
4. **Add production deployment** (with approval)
5. **Test each workflow** (push to branch, watch it run)

---

## Summary

- **Infrastructure**: Deploy with `cdk deploy`, uses `NOTES_APP_ENV`
- **Backend**: Deployed automatically by CDK (no separate workflow needed)
- **Frontend**: Build with `vite build`, deploy to S3/CloudFront or Amplify
- **Workflows**: YAML files in `.github/workflows/`
- **Secrets**: Store AWS credentials in GitHub Secrets
- **Approvals**: Use `environment: production` for manual approval gates

GitHub Actions watches your repo and automatically runs these workflows when code changes! 🚀
