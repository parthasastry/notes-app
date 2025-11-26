# CI/CD Concepts for Notes App

## Current State (Manual Deployment)

**What you're doing now:**

```bash
# Deploy to staging
cd infra
NOTES_APP_ENV=staging cdk deploy

# Deploy to production
cd infra
NOTES_APP_ENV=production cdk deploy
```

**Problems with manual deployment:**

- ❌ You have to remember to deploy after merging
- ❌ Easy to forget or make mistakes
- ❌ No deployment history/audit trail
- ❌ Can't deploy if you're not at your computer
- ❌ Inconsistent process (different people might deploy differently)
- ❌ No automated testing before deployment

---

## What is CI/CD?

### CI (Continuous Integration)

**Definition:** Automatically build and test your code when changes are pushed.

**What it does:**

- Runs tests automatically
- Checks code quality (linting, formatting)
- Builds your application
- Catches errors early

**Example flow:**

```
Developer pushes code → CI runs tests → If tests pass, code is ready
```

### CD (Continuous Deployment/Delivery)

**Definition:** Automatically deploy your code to environments after CI passes.

**What it does:**

- Deploys infrastructure (CDK)
- Deploys backend (Lambda functions)
- Deploys frontend (if using Amplify or S3)
- Runs smoke tests after deployment

**Example flow:**

```
Code merged to staging → CD deploys to staging → Test in staging → Merge to main → CD deploys to production
```

---

## CI/CD for Your Notes App

### Architecture Overview

```
GitHub Repository
    ↓
    ├─ Push to feature branch → CI: Run tests, linting
    ├─ Merge to staging → CI: Tests + CD: Deploy to staging
    └─ Merge to main → CI: Tests + CD: Deploy to production (with approval)
```

### What Gets Automated

#### 1. **Infrastructure Deployment (CDK)**

- When: After code is merged to `staging` or `main`
- What: Runs `cdk deploy` with correct environment
- Where: Staging → `us-east-2`, Production → `us-west-2`

#### 2. **Backend Deployment (Lambda)**

- When: Same as infrastructure
- What: Packages and deploys Lambda functions
- How: CDK handles this automatically (it's part of infrastructure)

#### 3. **Frontend Deployment (Optional)**

- When: After frontend code changes
- What: Builds React app and deploys to hosting
- Options: AWS Amplify, S3 + CloudFront, or separate CI/CD

---

## CI/CD Tools & Options

### Option 1: GitHub Actions (Recommended for GitHub repos)

**What it is:**

- Built into GitHub
- Free for public repos, free tier for private repos
- YAML-based configuration
- Runs in GitHub's cloud

**How it works:**

1. Create `.github/workflows/` directory
2. Define workflow YAML files
3. Workflows trigger on Git events (push, PR, merge)

**Example workflow structure:**

```yaml
# .github/workflows/deploy-staging.yml
on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Run tests
      - Deploy to staging (cdk deploy)
```

**Pros:**

- ✅ Free for most use cases
- ✅ Integrated with GitHub
- ✅ Easy to set up
- ✅ Good documentation

**Cons:**

- ⚠️ Requires AWS credentials (store as GitHub Secrets)
- ⚠️ Limited free minutes for private repos

---

### Option 2: AWS CodePipeline

**What it is:**

- AWS-native CI/CD service
- Integrates with CodeBuild, CodeDeploy
- Visual pipeline editor

**How it works:**

1. Connect to GitHub
2. Define pipeline stages
3. Automatically triggers on branch changes

**Pros:**

- ✅ Native AWS integration
- ✅ No need to manage AWS credentials externally
- ✅ Visual pipeline editor
- ✅ Built-in approval gates

**Cons:**

- ⚠️ More complex setup
- ⚠️ Costs money (but usually minimal)
- ⚠️ AWS-specific (less portable)

---

### Option 3: GitLab CI/CD

**What it is:**

- Built into GitLab
- Similar to GitHub Actions
- `.gitlab-ci.yml` configuration

**Pros:**

- ✅ Free for most use cases
- ✅ Integrated with GitLab
- ✅ Good Docker support

**Cons:**

- ⚠️ Only if using GitLab (not GitHub)

---

## Recommended Approach: GitHub Actions

### Workflow Structure

```
.github/workflows/
├── ci.yml              # Run tests on all PRs
├── deploy-staging.yml   # Deploy to staging on merge
└── deploy-production.yml # Deploy to production on merge (with approval)
```

### Branch Strategy with CI/CD

```
feature/your-feature
    ↓ (PR)
staging → [CI: Tests] → [CD: Deploy to staging] → Test manually
    ↓ (PR with approval)
main → [CI: Tests] → [CD: Deploy to production] → Monitor
```

---

## Key Concepts

### 1. **Triggers (When CI/CD Runs)**

**Push to branch:**

- Every commit triggers CI (tests)
- Merge triggers CD (deployment)

**Pull Request:**

- CI runs on PR creation/updates
- CD doesn't run (no deployment yet)

**Manual trigger:**

- Can manually trigger deployments
- Useful for hotfixes

### 2. **Secrets Management**

**Problem:** CI/CD needs AWS credentials to deploy

**Solution:** Store secrets in CI/CD platform

- GitHub: GitHub Secrets
- GitLab: CI/CD Variables
- AWS: Secrets Manager or IAM roles

**What secrets you need:**

- AWS Access Key ID
- AWS Secret Access Key
- AWS Region
- (Optional) AWS Account ID

**Security best practice:**

- Never commit credentials to code
- Use least-privilege IAM roles
- Rotate credentials regularly

### 3. **Environment Variables**

**In CI/CD:**

- Set `NOTES_APP_ENV=staging` or `production`
- Load from `.env.staging` or `.env.production`
- Or use CI/CD platform's environment variables

**Example:**

```yaml
env:
  NOTES_APP_ENV: staging
  CDK_DEFAULT_ACCOUNT: ${{ secrets.AWS_ACCOUNT_ID }}
  CDK_DEFAULT_REGION: us-east-2
```

### 4. **Approval Gates**

**For production deployments:**

- Require manual approval before deploying
- Prevents accidental production deployments
- Creates audit trail

**How it works:**

1. Code merged to `main`
2. CI runs tests (automatic)
3. CD waits for approval (manual)
4. After approval, deploys to production

### 5. **Deployment Steps**

**Typical CDK deployment workflow:**

```bash
# 1. Checkout code
git checkout staging

# 2. Install dependencies
cd infra
npm install

# 3. Bootstrap CDK (first time only)
cdk bootstrap

# 4. Run tests (optional)
npm test

# 5. Synthesize (preview changes)
cdk synth

# 6. Deploy
NOTES_APP_ENV=staging cdk deploy
```

---

## CI/CD Workflow Example

### Scenario: Adding a New Feature

**Step 1: Developer creates feature branch**

```bash
git checkout -b feature/new-feature
# Make changes
git push origin feature/new-feature
```

→ **CI runs:** Tests, linting (no deployment)

**Step 2: Create PR to staging**

- PR created: `feature/new-feature` → `staging`
- **CI runs:** Full test suite
- Code review happens
- PR approved and merged

**Step 3: Merge to staging**

```bash
git checkout staging
git merge feature/new-feature
git push origin staging
```

→ **CD triggers:** Deploys to staging environment

**Step 4: Test in staging**

- Manual testing
- Verify feature works
- Check for issues

**Step 5: Merge to main (production)**

```bash
git checkout main
git merge staging
git push origin main
```

→ **CD triggers:**

1. Runs tests
2. Waits for approval (manual)
3. After approval: Deploys to production

---

## What CI/CD Automates

### ✅ Automated (No manual steps)

1. **Running tests** - Every push/PR
2. **Code quality checks** - Linting, formatting
3. **Building** - Compile TypeScript, bundle frontend
4. **Deploying to staging** - After merge to staging
5. **Running smoke tests** - After deployment (optional)

### ⚠️ Manual (Still requires human)

1. **Code review** - PR approval
2. **Production approval** - Manual approval gate
3. **Testing in staging** - Manual verification
4. **Monitoring** - Watch for errors after deployment

---

## Security Considerations

### 1. **AWS Credentials**

**Best practice:**

- Use IAM roles with least privilege
- Store credentials as secrets (never in code)
- Rotate credentials regularly
- Use separate credentials for staging/production

**IAM permissions needed:**

- CloudFormation (create/update stacks)
- Lambda (deploy functions)
- DynamoDB (create/update tables)
- API Gateway (deploy APIs)
- Cognito (manage user pools)
- S3 (if deploying frontend)

### 2. **Environment Isolation**

**Staging:**

- Separate AWS account (ideal) or same account with different region
- Separate credentials
- Can't accidentally affect production

**Production:**

- Separate AWS account (ideal)
- Separate credentials
- Approval gates required

### 3. **Secrets in CI/CD**

**Never commit:**

- AWS credentials
- API keys
- Database passwords
- `.env` files with secrets

**Use:**

- CI/CD platform secrets (GitHub Secrets, etc.)
- AWS Secrets Manager (for runtime secrets)
- Environment variables in CI/CD

---

## Cost Considerations

### GitHub Actions

- **Free:** 2,000 minutes/month for private repos
- **Paid:** $0.008/minute after free tier
- Typical deployment: ~5-10 minutes
- Cost: ~$0.05 per deployment (after free tier)

### AWS CodePipeline

- **Free tier:** First 12 months
- **After:** ~$1/month per active pipeline
- Build minutes: ~$0.005/minute
- Typical cost: ~$5-10/month for active project

### AWS Lambda (Deployment)

- No additional cost (part of infrastructure)

---

## Implementation Phases

### Phase 1: Basic CI (Start Here)

**Goal:** Automate testing

**What to do:**

1. Set up GitHub Actions
2. Run tests on every PR
3. Block merge if tests fail

**Benefits:**

- Catch errors early
- Ensure code quality
- No deployment yet (low risk)

### Phase 2: CD for Staging

**Goal:** Automate staging deployments

**What to do:**

1. Add deployment workflow
2. Deploy to staging on merge to `staging` branch
3. Store AWS credentials as secrets

**Benefits:**

- Faster feedback
- Consistent deployments
- Practice for production

### Phase 3: CD for Production

**Goal:** Automate production deployments

**What to do:**

1. Add production deployment workflow
2. Require approval gate
3. Add monitoring/alerting

**Benefits:**

- Reduced human error
- Faster releases
- Audit trail

---

## Example: GitHub Actions Workflow

### CI Workflow (Tests on PRs)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [staging, main]
  push:
    branches: [staging, main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: |
          cd infra
          npm install

      - name: Run tests
        run: |
          cd infra
          npm test

      - name: Lint
        run: |
          cd infra
          npm run lint
```

### CD Workflow (Deploy to Staging)

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_STAGING }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_STAGING }}
          aws-region: us-east-2

      - name: Install dependencies
        run: |
          cd infra
          npm install

      - name: Deploy to staging
        env:
          NOTES_APP_ENV: staging
          CDK_DEFAULT_ACCOUNT: ${{ secrets.AWS_ACCOUNT_ID }}
          CDK_DEFAULT_REGION: us-east-2
        run: |
          cd infra
          npx cdk deploy --require-approval never
```

### CD Workflow (Deploy to Production with Approval)

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production # Requires approval
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PRODUCTION }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PRODUCTION }}
          aws-region: us-west-2

      - name: Install dependencies
        run: |
          cd infra
          npm install

      - name: Deploy to production
        env:
          NOTES_APP_ENV: production
          CDK_DEFAULT_ACCOUNT: ${{ secrets.AWS_ACCOUNT_ID }}
          CDK_DEFAULT_REGION: us-west-2
        run: |
          cd infra
          npx cdk deploy --require-approval never
```

---

## Key Takeaways

1. **CI (Continuous Integration):**

   - Automatically tests code
   - Runs on every push/PR
   - Catches errors early

2. **CD (Continuous Deployment):**

   - Automatically deploys code
   - Runs after merge to target branch
   - Can require approval for production

3. **Branch Strategy:**

   - `feature/*` → CI only (tests)
   - `staging` → CI + CD (deploy to staging)
   - `main` → CI + CD with approval (deploy to production)

4. **Security:**

   - Store AWS credentials as secrets
   - Use least-privilege IAM roles
   - Separate credentials for staging/production

5. **Implementation:**
   - Start with CI (testing)
   - Add CD for staging
   - Finally add CD for production with approval

---

## Next Steps

1. **Learn GitHub Actions basics** (if using GitHub)
2. **Set up AWS credentials** (IAM user with deployment permissions)
3. **Create first CI workflow** (just tests, no deployment)
4. **Test CI workflow** (create PR, verify tests run)
5. **Add CD workflow for staging** (deploy on merge to staging)
6. **Add CD workflow for production** (with approval gate)

This gives you a complete CI/CD pipeline that automates your deployment process! 🚀
