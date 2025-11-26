# AWS Amplify vs GitHub Actions for Frontend Deployment

## Current Setup (Amplify Auto-Deploy)

### How It Works Now

```
You push code to GitHub
    ↓
AWS Amplify detects the push (webhook)
    ↓
Amplify automatically:
  - Checks out code
  - Installs dependencies
  - Builds your app
  - Deploys to Amplify hosting
    ↓
Your app is live!
```

**Key characteristics:**

- ✅ **Fully automatic** - No configuration needed
- ✅ **Built-in hosting** - Amplify provides hosting automatically
- ✅ **Branch-based deployments** - Each branch gets its own URL
- ✅ **Zero setup** - Just connect GitHub repo in Amplify Console
- ⚠️ **Less control** - Can't customize build/deploy process easily
- ⚠️ **Amplify-specific** - Tied to Amplify platform

---

## What Changes with GitHub Actions?

When you add GitHub Actions, you have **three options**:

### Option 1: Keep Amplify, Add GitHub Actions for Control

**Best for:** Want more control but keep Amplify hosting

### Option 2: Replace Amplify with S3/CloudFront

**Best for:** Want full control and use your own infrastructure

### Option 3: Hybrid Approach

**Best for:** Use GitHub Actions for CI/testing, Amplify for deployment

---

## Option 1: Keep Amplify + Trigger via GitHub Actions

### How It Works

```
You push code to GitHub
    ↓
GitHub Actions triggers
    ↓
GitHub Actions:
  - Runs tests
  - Lints code
  - (Optional) Builds locally to verify
    ↓
GitHub Actions triggers Amplify deployment
    ↓
Amplify builds and deploys (as before)
    ↓
Your app is live!
```

### Why Do This?

**Benefits:**

- ✅ Keep Amplify's easy hosting
- ✅ Add CI/testing before deployment
- ✅ More control over when deployments happen
- ✅ Can add approval gates
- ✅ Better integration with your infra/backend deployments

**Drawbacks:**

- ⚠️ Slightly more complex setup
- ⚠️ Still dependent on Amplify

### Setup

**Step 1: Disable Amplify Auto-Deploy**

In Amplify Console:

1. Go to your app
2. App settings → General
3. Disable "Auto-deploy" for branches (or keep it, but GitHub Actions will trigger manually)

**Step 2: Create GitHub Actions Workflow**

```yaml
# .github/workflows/deploy-frontend-amplify.yml
name: Deploy Frontend via Amplify

on:
  push:
    branches: [staging, main]
    paths:
      - "frontend/**"
      - ".github/workflows/deploy-frontend-amplify.yml"

jobs:
  # CI: Test and lint before deploying
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

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

      - name: Lint
        run: |
          cd frontend
          npm run lint

      - name: Build (verify it works)
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL_STAGING }}
          VITE_USER_POOL_ID: ${{ secrets.VITE_USER_POOL_ID_STAGING }}
          VITE_USER_POOL_CLIENT_ID: ${{ secrets.VITE_USER_POOL_CLIENT_ID_STAGING }}
          VITE_REGION: us-east-2
        run: |
          cd frontend
          npm run build

  # CD: Trigger Amplify deployment
  deploy:
    runs-on: ubuntu-latest
    needs: ci # Only deploy if CI passes
    if: github.ref == 'refs/heads/staging' || github.ref == 'refs/heads/main'
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_STAGING }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_STAGING }}
          aws-region: us-east-2

      - name: Trigger Amplify deployment
        run: |
          # Determine branch name
          BRANCH_NAME=${GITHUB_REF#refs/heads/}

          # Determine app ID based on branch
          if [ "$BRANCH_NAME" = "staging" ]; then
            APP_ID=${{ secrets.AMPLIFY_APP_ID_STAGING }}
          else
            APP_ID=${{ secrets.AMPLIFY_APP_ID_PRODUCTION }}
          fi

          # Start Amplify deployment job
          aws amplify start-job \
            --app-id $APP_ID \
            --branch-name $BRANCH_NAME \
            --job-type RELEASE
```

**Step 3: Add Secrets to GitHub**

- `AMPLIFY_APP_ID_STAGING` - Get from Amplify Console
- `AMPLIFY_APP_ID_PRODUCTION` - Get from Amplify Console
- `AWS_ACCESS_KEY_ID_STAGING`
- `AWS_SECRET_ACCESS_KEY_STAGING`
- `VITE_API_URL_STAGING`
- `VITE_USER_POOL_ID_STAGING`
- `VITE_USER_POOL_CLIENT_ID_STAGING`

### Key Differences from Auto-Deploy

| Aspect             | Amplify Auto-Deploy | GitHub Actions + Amplify      |
| ------------------ | ------------------- | ----------------------------- |
| **Trigger**        | Automatic on push   | GitHub Actions triggers       |
| **CI/Testing**     | None                | Can add tests, linting        |
| **Control**        | Limited             | Full control                  |
| **Approval Gates** | No                  | Yes (for production)          |
| **Integration**    | Standalone          | Integrated with infra/backend |
| **Hosting**        | Amplify             | Still Amplify                 |

---

## Option 2: Replace Amplify with S3/CloudFront

### How It Works

```
You push code to GitHub
    ↓
GitHub Actions triggers
    ↓
GitHub Actions:
  - Checks out code
  - Installs dependencies
  - Builds app
  - Uploads to S3
  - Invalidates CloudFront cache
    ↓
Your app is live!
```

### Why Do This?

**Benefits:**

- ✅ Full control over build and deploy process
- ✅ Consistent with infrastructure-as-code approach
- ✅ Can manage S3/CloudFront via CDK
- ✅ No dependency on Amplify platform
- ✅ Better cost control

**Drawbacks:**

- ⚠️ More setup required (S3 bucket, CloudFront distribution)
- ⚠️ Need to manage hosting infrastructure
- ⚠️ More complex than Amplify

### Setup

**Step 1: Create S3 Bucket and CloudFront Distribution**

Add to your CDK infrastructure:

```typescript
// infra/lib/frontend-stack.ts
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // S3 bucket for hosting
    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      bucketName: `notes-app-frontend-${props.env?.account}-${props.env?.region}`,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html", // For SPA routing
      publicReadAccess: false, // CloudFront will access it
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html", // For SPA routing
        },
      ],
    });

    // Outputs
    new CfnOutput(this, "S3BucketName", {
      value: websiteBucket.bucketName,
    });

    new CfnOutput(this, "CloudFrontDistributionId", {
      value: distribution.distributionId,
    });

    new CfnOutput(this, "CloudFrontUrl", {
      value: `https://${distribution.distributionDomainName}`,
    });
  }
}
```

**Step 2: Create GitHub Actions Workflow**

```yaml
# .github/workflows/deploy-frontend-s3.yml
name: Deploy Frontend to S3/CloudFront

on:
  push:
    branches: [staging, main]
    paths:
      - "frontend/**"
      - ".github/workflows/deploy-frontend-s3.yml"

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

**Step 3: Add Secrets to GitHub**

- `S3_BUCKET_STAGING`
- `S3_BUCKET_PRODUCTION`
- `CLOUDFRONT_DISTRIBUTION_ID_STAGING`
- `CLOUDFRONT_DISTRIBUTION_ID_PRODUCTION`
- `VITE_API_URL_STAGING`
- `VITE_USER_POOL_ID_STAGING`
- `VITE_USER_POOL_CLIENT_ID_STAGING`

### Key Differences from Amplify

| Aspect          | Amplify            | S3/CloudFront              |
| --------------- | ------------------ | -------------------------- |
| **Setup**       | Connect repo, done | Need S3 + CloudFront setup |
| **Hosting**     | Managed by Amplify | You manage                 |
| **Cost**        | Amplify pricing    | S3 + CloudFront pricing    |
| **Control**     | Limited            | Full control               |
| **CI/CD**       | Built-in           | Via GitHub Actions         |
| **Branch URLs** | Automatic          | Need to configure          |

---

## Option 3: Hybrid Approach (Recommended for Learning)

### How It Works

```
You push code to GitHub
    ↓
GitHub Actions runs CI (tests, linting)
    ↓
If CI passes:
  - Option A: Let Amplify auto-deploy (keep it simple)
  - Option B: Trigger Amplify manually via GitHub Actions
    ↓
Your app is live!
```

### Why This Is Good for Learning

- ✅ Start simple: Keep Amplify auto-deploy
- ✅ Add CI gradually: Test and lint before deployment
- ✅ Learn GitHub Actions without breaking current setup
- ✅ Can migrate to full control later

### Setup

**Step 1: Keep Amplify Auto-Deploy Enabled**

Don't change anything in Amplify Console.

**Step 2: Add CI Workflow (No Deployment)**

```yaml
# .github/workflows/ci-frontend.yml
name: CI - Frontend

on:
  pull_request:
    branches: [staging, main]
    paths:
      - "frontend/**"
  push:
    branches: [staging, main]
    paths:
      - "frontend/**"

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

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

      - name: Lint
        run: |
          cd frontend
          npm run lint

      - name: Build (verify)
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL_STAGING }}
          VITE_USER_POOL_ID: ${{ secrets.VITE_USER_POOL_ID_STAGING }}
          VITE_USER_POOL_CLIENT_ID: ${{ secrets.VITE_USER_POOL_CLIENT_ID_STAGING }}
          VITE_REGION: us-east-2
        run: |
          cd frontend
          npm run build
```

**What happens:**

- ✅ GitHub Actions runs tests/linting on PRs
- ✅ Amplify still auto-deploys on merge (unchanged)
- ✅ You get CI benefits without changing deployment

**Later, you can:**

- Add deployment workflow when ready
- Migrate to S3/CloudFront if needed
- Add more sophisticated CI checks

---

## Comparison Table

| Feature              | Amplify Auto-Deploy | GitHub Actions + Amplify | GitHub Actions + S3/CloudFront |
| -------------------- | ------------------- | ------------------------ | ------------------------------ |
| **Setup Complexity** | ⭐ Very Easy        | ⭐⭐ Easy                | ⭐⭐⭐ Moderate                |
| **Control**          | ⭐ Limited          | ⭐⭐ Good                | ⭐⭐⭐ Full                    |
| **CI/Testing**       | ❌ None             | ✅ Yes                   | ✅ Yes                         |
| **Approval Gates**   | ❌ No               | ✅ Yes                   | ✅ Yes                         |
| **Cost**             | Amplify pricing     | Amplify pricing          | S3 + CloudFront                |
| **Integration**      | Standalone          | Good                     | Excellent                      |
| **Learning Curve**   | Easy                | Moderate                 | Steeper                        |
| **Best For**         | Quick start         | More control             | Full control                   |

---

## Recommendation for Your Learning Project

### Phase 1: Start with Hybrid (Option 3)

1. Keep Amplify auto-deploy working
2. Add GitHub Actions CI workflow (just testing/linting)
3. Learn GitHub Actions without breaking current setup

### Phase 2: Add Deployment Control (Option 1)

1. Keep Amplify hosting
2. Add GitHub Actions deployment workflow
3. Trigger Amplify via GitHub Actions
4. Add approval gates for production

### Phase 3: Full Control (Option 2) - Optional

1. If you want to learn S3/CloudFront
2. Replace Amplify with S3/CloudFront
3. Manage everything via CDK + GitHub Actions

---

## Migration Path

### From Amplify Auto-Deploy → GitHub Actions + Amplify

1. **Keep Amplify app running** (don't delete it)
2. **Add GitHub Actions workflow** (Option 1)
3. **Test on staging branch** first
4. **Disable Amplify auto-deploy** (optional, or keep both)
5. **Verify deployments work**
6. **Switch to GitHub Actions triggers**

### From Amplify → S3/CloudFront

1. **Create S3 bucket and CloudFront** via CDK
2. **Add GitHub Actions workflow** (Option 2)
3. **Test deployment to staging**
4. **Update DNS/domain** if using custom domain
5. **Decommission Amplify app** (after verifying everything works)

---

## Key Takeaways

1. **Amplify auto-deploy** = Easiest, but less control
2. **GitHub Actions + Amplify** = More control, keep easy hosting
3. **GitHub Actions + S3/CloudFront** = Full control, more setup
4. **Start simple**: Use hybrid approach to learn gradually
5. **You can always migrate** from one approach to another

The main change with GitHub Actions is **you get control over the deployment process** - when it happens, what tests run first, and how it integrates with your infrastructure deployments.
