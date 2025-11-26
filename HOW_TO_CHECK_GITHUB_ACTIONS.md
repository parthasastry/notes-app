# How to Check if GitHub Actions is Triggered

## Quick Answer

**Go to your GitHub repository → Click "Actions" tab → See all workflow runs**

---

## Method 1: GitHub Web Interface (Easiest)

### Step-by-Step

1. **Go to your repository on GitHub:**

   ```
   https://github.com/parthasastry/notes-app
   ```

2. **Click the "Actions" tab** (top menu bar, next to "Code", "Issues", etc.)

3. **You'll see:**

   - List of all workflow runs
   - Status indicators:
     - 🟡 **Yellow dot** = Running/In progress
     - ✅ **Green checkmark** = Success
     - ❌ **Red X** = Failed
     - ⚪ **Gray circle** = Cancelled
     - ⏸️ **Paused** = Waiting for approval

4. **Click on a workflow run** to see:
   - Which workflow ran (CI, Deploy to Staging, etc.)
   - Which branch triggered it
   - Which commit triggered it
   - Detailed logs for each step

### What You'll See

**Workflow List View:**

```
Actions
├── ✅ Deploy to Staging (staging branch) - 2 minutes ago
├── ✅ CI (Pull request #5) - 1 hour ago
└── 🟡 Deploy to Production (main branch) - Running...
```

**Workflow Detail View:**

```
Deploy to Staging
Branch: staging
Commit: abc123 "Merge test branch"
Status: ✅ Success

Jobs:
  deploy
    ✅ Checkout code (5s)
    ✅ Setup Node.js (10s)
    ✅ Configure AWS credentials (2s)
    ✅ Install dependencies (15s)
    ✅ Build TypeScript (8s)
    ✅ Deploy infrastructure (2m 30s)
```

---

## Method 2: Check via URL

**Direct link to Actions:**

```
https://github.com/parthasastry/notes-app/actions
```

**Direct link to a specific workflow:**

```
https://github.com/parthasastry/notes-app/actions/workflows/deploy-staging.yml
```

---

## Method 3: Check Workflow Status Badge

Add a status badge to your README to see workflow status at a glance:

```markdown
![CI](https://github.com/parthasastry/notes-app/workflows/CI/badge.svg)
![Deploy to Staging](https://github.com/parthasastry/notes-app/workflows/Deploy%20to%20Staging/badge.svg)
```

**How to get the badge URL:**

1. Go to Actions tab
2. Click on a workflow (e.g., "CI")
3. Click the "..." menu (three dots)
4. Select "Create status badge"
5. Copy the markdown code

---

## Method 4: Check via GitHub CLI

If you have GitHub CLI installed:

```bash
# List recent workflow runs
gh run list

# Watch a specific workflow run
gh run watch

# View details of a specific run
gh run view <run-id>

# View logs
gh run view <run-id> --log
```

---

## Understanding Workflow Status

### Status Indicators

| Icon | Status    | Meaning                                    |
| ---- | --------- | ------------------------------------------ |
| 🟡   | Running   | Workflow is currently executing            |
| ✅   | Success   | All steps completed successfully           |
| ❌   | Failed    | One or more steps failed                   |
| ⚪   | Cancelled | Workflow was cancelled                     |
| ⏸️   | Waiting   | Waiting for approval (production)          |
| ⏸️   | Queued    | Waiting to start (other workflows running) |

### Workflow States

**Queued:**

- Workflow is waiting to start
- Usually happens when multiple workflows trigger at once
- Will start automatically when a runner is available

**In Progress:**

- Workflow is currently running
- You can see which step is executing
- Click to see live logs

**Completed:**

- ✅ Success: All steps passed
- ❌ Failure: One or more steps failed
- Click to see detailed logs

---

## What Triggers Each Workflow

### CI Workflow (`ci.yml`)

**Triggers when:**

- Pull request created to `staging` or `main`
- Push to `staging` or `main` (if `infra/` or `backend/` files change)

**How to check:**

1. Go to Actions tab
2. Look for "CI" workflow
3. Check the branch/PR that triggered it

### Deploy to Staging (`deploy-staging.yml`)

**Triggers when:**

- Push to `staging` branch
- Only if files in `infra/` or `backend/` change

**How to check:**

1. Go to Actions tab
2. Look for "Deploy to Staging" workflow
3. Should show "staging" branch
4. Status should be ✅ Success or ❌ Failed

### Deploy to Production (`deploy-production.yml`)

**Triggers when:**

- Push to `main` branch
- Only if files in `infra/` or `backend/` change
- **Requires approval** (if environment is configured)

**How to check:**

1. Go to Actions tab
2. Look for "Deploy to Production" workflow
3. Should show "main" branch
4. May show ⏸️ Waiting if approval is required

---

## Troubleshooting: Workflow Not Triggering

### Check 1: Is the workflow file in the right place?

```bash
# Should exist:
.github/workflows/ci.yml
.github/workflows/deploy-staging.yml
.github/workflows/deploy-production.yml
```

### Check 2: Did you push to the right branch?

- **CI**: Triggers on PRs or pushes to `staging`/`main`
- **Staging deploy**: Only triggers on push to `staging` branch
- **Production deploy**: Only triggers on push to `main` branch

### Check 3: Did you change the right files?

Workflows have path filters:

- Only trigger if files in `infra/` or `backend/` change
- Changing only `frontend/` won't trigger infra/backend workflows

### Check 4: Check workflow syntax

1. Go to Actions tab
2. If workflow has syntax errors, you'll see a red X
3. Click to see the error message

### Check 5: Check branch protection

- If branch is protected, workflows might be blocked
- Check repository Settings → Branches

---

## Viewing Workflow Logs

### Step-by-Step

1. **Go to Actions tab**
2. **Click on a workflow run** (the name, not the status icon)
3. **Click on a job** (e.g., "deploy")
4. **Click on a step** to see its logs

### What You'll See in Logs

**Successful step:**

```
Run cd infra
  cd infra
  npm ci
  ✓ Installed dependencies
  ✓ Build completed
```

**Failed step:**

```
Run cd infra
  cd infra
  npm ci
  ✗ Error: npm ERR! code ENOENT
  npm ERR! syscall open
  npm ERR! path /home/runner/package.json
```

### Downloading Logs

1. Click on a workflow run
2. Click "..." menu (top right)
3. Select "Download log archive"
4. Extract to view all logs

---

## Real-Time Monitoring

### Watch a Workflow Run Live

1. Go to Actions tab
2. Click on a running workflow (🟡 yellow dot)
3. Logs update in real-time
4. Refresh page to see latest status

### Get Notifications

**Email notifications:**

- GitHub sends email when workflow fails
- Go to Settings → Notifications → Actions

**GitHub mobile app:**

- Get push notifications for workflow status
- Install GitHub mobile app

---

## Quick Checks

### Is workflow running right now?

```bash
# Check Actions tab
# Look for 🟡 yellow dot = running
```

### Did workflow succeed?

```bash
# Check Actions tab
# Look for ✅ green checkmark = success
```

### Did workflow fail?

```bash
# Check Actions tab
# Look for ❌ red X = failed
# Click to see error logs
```

### When was last deployment?

```bash
# Go to Actions tab
# Look at "Deploy to Staging" or "Deploy to Production"
# Check the timestamp
```

---

## Example: Checking After a Push

**After pushing to staging:**

1. **Go to:** `https://github.com/parthasastry/notes-app/actions`

2. **You should see:**

   - "Deploy to Staging" workflow appears
   - Status: 🟡 Running (then ✅ Success or ❌ Failed)

3. **Click on it to see:**

   - Which commit triggered it
   - Which branch (should be "staging")
   - Step-by-step progress
   - Final result

4. **If it fails:**
   - Click on the failed step
   - Read the error message
   - Fix the issue
   - Push again

---

## Summary

**To check if GitHub Actions is triggered:**

1. ✅ **Go to Actions tab** in your GitHub repository
2. ✅ **Look for workflow runs** - they appear immediately after trigger
3. ✅ **Check status icons** - 🟡 running, ✅ success, ❌ failed
4. ✅ **Click on a run** to see detailed logs
5. ✅ **Check which branch/commit** triggered it

**Quick URL:**

```
https://github.com/parthasastry/notes-app/actions
```

**Pro tip:** Bookmark the Actions tab URL for quick access!
