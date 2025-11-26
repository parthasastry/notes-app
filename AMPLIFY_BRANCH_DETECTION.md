# How AWS Amplify Knows: Staging vs Production

## The Simple Answer

**AWS Amplify uses branches to determine which environment to deploy to.**

- Push to `staging` branch → Amplify deploys to **staging** environment
- Push to `main` branch → Amplify deploys to **production** environment

**Key difference from GitHub Actions:** Amplify creates a separate deployment for each branch automatically, and each branch gets its own URL.

---

## How Amplify Works: Branch-Based Deployments

### The Core Concept

**In Amplify, branches = environments.**

When you connect your GitHub repo to Amplify, Amplify:

1. **Detects which branch was pushed** (via GitHub webhook)
2. **Finds the matching branch in Amplify** (or creates it)
3. **Uses that branch's build settings** (environment variables, build commands)
4. **Deploys to that branch's unique URL**

---

## Setup Methods: Two Approaches

### Approach 1: One Amplify App, Multiple Branches (Recommended)

**Single Amplify app with multiple branches:**

```
Amplify App: "notes-app"
├── Branch: main (production)
│   ├── URL: https://main.xxxxx.amplifyapp.com
│   ├── Build settings: Production env vars
│   └── Auto-deploy: Enabled
│
└── Branch: staging
    ├── URL: https://staging.xxxxx.amplifyapp.com
    ├── Build settings: Staging env vars
    └── Auto-deploy: Enabled
```

**How it works:**

1. **Initial Setup:**

   - Connect GitHub repo to Amplify
   - Amplify detects `main` branch first
   - Creates branch in Amplify called `main`
   - Deploys `main` branch

2. **Add Staging Branch:**

   - In Amplify Console, go to your app
   - Click "Add branch"
   - Name it: `staging`
   - Connect it to your `staging` branch in GitHub
   - Configure build settings (different env vars)

3. **When You Push:**
   ```
   Push to staging branch in GitHub
       ↓
   GitHub webhook notifies Amplify
       ↓
   Amplify detects: "This push is for staging branch"
       ↓
   Amplify finds: Branch "staging" in Amplify app
       ↓
   Amplify uses: Staging branch's build settings
       ↓
   Amplify builds and deploys to: staging.xxxxx.amplifyapp.com
   ```

### Approach 2: Separate Amplify Apps

**Two separate Amplify apps (one per environment):**

```
Amplify App 1: "notes-app-staging"
└── Branch: staging
    └── URL: https://staging.xxxxx.amplifyapp.com

Amplify App 2: "notes-app-production"
└── Branch: main
    └── URL: https://production.xxxxx.amplifyapp.com
```

**When to use:**

- Complete isolation between environments
- Different AWS accounts per environment
- Different build processes

**How it works:**

- Each app connects to the same GitHub repo
- Each app watches a specific branch
- Push to `staging` → Only staging app deploys
- Push to `main` → Only production app deploys

---

## How Amplify Detects the Branch

### Step 1: GitHub Webhook

When you push to GitHub:

1. GitHub sends a webhook to Amplify
2. Webhook includes: **branch name**, commit info, changed files
3. Amplify receives: `"ref": "refs/heads/staging"` or `"ref": "refs/heads/main"`

### Step 2: Branch Matching

Amplify looks for a matching branch in your Amplify app:

- If branch exists → Use that branch's configuration
- If branch doesn't exist → Create new branch (if auto-deploy enabled)

### Step 3: Build and Deploy

Amplify uses the branch's specific:

- Build settings (commands, Node version)
- Environment variables
- Build artifacts location
- Deploy URL

---

## Configuration: Branch-Specific Settings

### Setting Up Branch-Specific Environment Variables

**In Amplify Console:**

1. Go to your Amplify app
2. Click on a branch (e.g., `staging`)
3. Go to **Environment variables**
4. Add variables specific to that branch:

**For `staging` branch:**

```
VITE_API_URL=https://api-staging.execute-api.us-east-2.amazonaws.com/prod
VITE_USER_POOL_ID=us-east-2_xxxxx
VITE_USER_POOL_CLIENT_ID=xxxxx
VITE_AWS_REGION=us-east-2
```

**For `main` branch:**

```
VITE_API_URL=https://api-production.execute-api.us-west-2.amazonaws.com/prod
VITE_USER_POOL_ID=us-west-2_xxxxx
VITE_USER_POOL_CLIENT_ID=xxxxx
VITE_AWS_REGION=us-west-2
```

### Setting Up Branch-Specific Build Settings

**For `staging` branch:**

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - "**/*"
  cache:
    paths:
      - node_modules/**/*
```

**For `main` branch:**

Same build settings, but different environment variables are injected during build.

**Note:** You can have different build commands per branch if needed, but typically they're the same.

---

## Complete Setup Example

### Initial Setup (One App, Multiple Branches)

**Step 1: Connect GitHub Repo**

1. Go to AWS Amplify Console
2. Click "New app" → "Host web app"
3. Choose "GitHub"
4. Authorize GitHub
5. Select your repository: `notes-app`
6. Select branch: `main` (or `staging` first)
7. Amplify auto-detects build settings

**Step 2: Configure Main Branch (Production)**

1. After app is created, click on `main` branch
2. Go to **Environment variables**
3. Add production variables:
   ```
   VITE_API_URL=https://api-production.execute-api.us-west-2.amazonaws.com/prod
   VITE_USER_POOL_ID=us-west-2_xxxxx
   VITE_USER_POOL_CLIENT_ID=xxxxx
   VITE_AWS_REGION=us-west-2
   ```

**Step 3: Add Staging Branch**

1. In Amplify app, click "Add branch"
2. Branch name: `staging`
3. Connect to: `staging` branch in GitHub
4. Copy build settings from `main` (or configure separately)
5. Go to **Environment variables** for `staging` branch
6. Add staging variables:
   ```
   VITE_API_URL=https://api-staging.execute-api.us-east-2.amazonaws.com/prod
   VITE_USER_POOL_ID=us-east-2_xxxxx
   VITE_USER_POOL_CLIENT_ID=xxxxx
   VITE_AWS_REGION=us-east-2
   ```

**Step 4: Configure Auto-Deploy**

For each branch:

1. Go to branch settings
2. Under "Build settings"
3. Ensure "Auto-deploy" is enabled
4. Choose when to deploy:
   - **Every push** (recommended for staging)
   - **Pull request only** (for feature branches)
   - **Manual** (for production, if you want approval)

---

## How the Deployment Flow Works

### Scenario 1: Push to Staging Branch

```
1. Developer pushes to staging
   git checkout staging
   git push origin staging

2. GitHub sends webhook to Amplify
   {
     "ref": "refs/heads/staging",
     "repository": "your-repo",
     "commits": [...]
   }

3. Amplify receives webhook
   - Detects: branch = "staging"
   - Looks up: Branch "staging" in Amplify app
   - Finds: Staging branch configuration

4. Amplify starts build
   - Uses: Staging branch's build settings
   - Injects: Staging environment variables
   - Runs: npm ci && npm run build

5. Amplify deploys
   - Uploads: dist/ folder
   - Deploys to: https://staging.xxxxx.amplifyapp.com
   - Updates: Staging URL with new code

6. Deployment complete ✅
```

### Scenario 2: Push to Main Branch

```
1. Developer merges staging → main
   git checkout main
   git merge staging
   git push origin main

2. GitHub sends webhook to Amplify
   {
     "ref": "refs/heads/main",
     ...
   }

3. Amplify receives webhook
   - Detects: branch = "main"
   - Looks up: Branch "main" in Amplify app
   - Finds: Main branch configuration

4. Amplify starts build
   - Uses: Main branch's build settings
   - Injects: Production environment variables
   - Runs: npm ci && npm run build

5. Amplify deploys
   - Uploads: dist/ folder
   - Deploys to: https://main.xxxxx.amplifyapp.com
   - Updates: Production URL with new code

6. Deployment complete ✅
```

---

## Branch Configuration in Amplify Console

### Viewing Branch Settings

**In Amplify Console:**

1. Select your app
2. You'll see all branches listed:

   ```
   Branches:
   ├── main (Production) [Active]
   └── staging [Active]
   ```

3. Click on a branch to see:
   - **Build settings** - Commands, Node version
   - **Environment variables** - Branch-specific vars
   - **Deployment history** - Past deployments
   - **URL** - Branch-specific URL

### Branch-Specific URLs

Each branch gets its own URL:

```
Main branch:    https://main.xxxxx.amplifyapp.com
Staging branch: https://staging.xxxxx.amplifyapp.com
```

**Or with custom domains:**

```
Main branch:    https://app.yourdomain.com
Staging branch: https://staging.yourdomain.com
```

---

## Environment Variables: How They Work

### Build-Time vs Runtime

**Vite environment variables** (like `VITE_API_URL`) are:

- Injected at **build time**
- Embedded in the JavaScript bundle
- Different per branch

**How Amplify handles this:**

1. **During build:**

   ```bash
   # Amplify sets environment variables
   export VITE_API_URL=https://api-staging...
   export VITE_USER_POOL_ID=us-east-2_xxxxx

   # Then runs build
   npm run build
   ```

2. **Vite reads variables:**

   ```javascript
   // In your code
   const apiUrl = import.meta.env.VITE_API_URL;
   // This gets the value from Amplify's environment variables
   ```

3. **Result:**
   - Staging build has staging API URL
   - Production build has production API URL

### Setting Environment Variables

**Method 1: Amplify Console (Recommended)**

1. Go to branch → Environment variables
2. Add variable:
   - Key: `VITE_API_URL`
   - Value: `https://api-staging...`
3. Save

**Method 2: amplify.yml (Build Settings)**

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - echo "VITE_API_URL=$VITE_API_URL" # Uses Amplify env var
    build:
      commands:
        - npm run build
```

**Method 3: .env Files (Not Recommended for Amplify)**

`.env` files in your repo won't work well because:

- They're the same for all branches
- Amplify environment variables override them
- Better to use Amplify's environment variables per branch

---

## Auto-Deploy Configuration

### Per-Branch Auto-Deploy Settings

**For `staging` branch:**

- **Auto-deploy:** Enabled
- **Deploy on:** Every push
- **Purpose:** Fast feedback, test changes quickly

**For `main` branch:**

- **Auto-deploy:** Enabled (or disabled for manual)
- **Deploy on:** Every push (or manual approval)
- **Purpose:** Production deployments

### Disabling Auto-Deploy

If you want to use GitHub Actions to trigger deployments:

1. Go to branch settings
2. Disable "Auto-deploy"
3. Deploy manually or via GitHub Actions API

---

## Comparison: Amplify vs GitHub Actions

| Aspect                    | Amplify Auto-Deploy    | GitHub Actions               |
| ------------------------- | ---------------------- | ---------------------------- |
| **Branch Detection**      | Automatic via webhook  | Configured in workflow `on:` |
| **Environment Mapping**   | Branch = Environment   | Branch triggers workflow     |
| **Configuration**         | Per-branch in Console  | Per-workflow in YAML         |
| **Environment Variables** | Set in Amplify Console | Set in workflow `env:`       |
| **Build Settings**        | amplify.yml or Console | Defined in workflow steps    |
| **URLs**                  | Automatic per branch   | Manual S3/CloudFront setup   |
| **Control**               | Limited                | Full control                 |

---

## Troubleshooting

### Issue: Wrong Environment Variables Used

**Problem:** Staging branch uses production API URL

**Solution:**

1. Check branch's environment variables in Amplify Console
2. Ensure you're editing the correct branch
3. Redeploy after changing variables

### Issue: Branch Not Deploying

**Problem:** Push to branch, but no deployment

**Solution:**

1. Check if branch exists in Amplify
2. Verify auto-deploy is enabled for that branch
3. Check GitHub webhook is connected
4. Look at Amplify build logs

### Issue: Both Branches Deploy on One Push

**Problem:** Push to staging also triggers main

**Solution:**

- This shouldn't happen - each branch deploys independently
- Check if you have multiple Amplify apps connected
- Verify branch names match exactly

---

## Best Practices

### 1. Use Descriptive Branch Names

```
✅ Good:
- main (production)
- staging
- develop

❌ Avoid:
- prod (unclear)
- staging-2 (confusing)
```

### 2. Separate Environment Variables Per Branch

- Don't use the same variables for staging and production
- Use Amplify Console to set branch-specific vars
- Document which variables each branch needs

### 3. Use Custom Domains

- Main: `app.yourdomain.com`
- Staging: `staging.yourdomain.com`
- Makes it clear which environment you're using

### 4. Enable Build Notifications

- Get notified when builds fail
- Monitor deployment status
- Set up alerts for production deployments

### 5. Use Preview Deployments for PRs

- Amplify can deploy previews for pull requests
- Test changes before merging
- Automatic cleanup when PR is closed

---

## Summary

**How Amplify knows staging vs production:**

1. **Branch detection** - GitHub webhook tells Amplify which branch was pushed
2. **Branch matching** - Amplify finds matching branch in Amplify app
3. **Branch configuration** - Uses that branch's build settings and environment variables
4. **Separate deployments** - Each branch deploys to its own URL
5. **Environment variables** - Set per branch in Amplify Console

**Key takeaway:** In Amplify, **branches = environments**. Each branch in your GitHub repo maps to a branch in Amplify, and each Amplify branch has its own configuration, environment variables, and URL.

**The flow:**

```
Push to branch → GitHub webhook → Amplify detects branch →
Uses branch config → Builds with branch env vars →
Deploys to branch URL
```

This is simpler than GitHub Actions because Amplify handles the branch detection and environment mapping automatically - you just configure each branch once in the Amplify Console!
