# Phase 1: Feature Branch Workflow - Step by Step Guide

## Prerequisites

- Git installed
- Working notes app
- Staging and production environments configured

## Step-by-Step Guide

### Step 1: Initialize Git Repository

```bash
cd /Users/parthasarathysastry/Documents/Development/projects/notes-app

# Initialize Git repo
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Working notes app with CRUD functionality"
```

### Step 2: Create Staging Branch

```bash
# Create and switch to staging branch
git checkout -b staging

# Push staging branch to remote (when you set up remote)
# git push -u origin staging
```

### Step 3: Create Feature Branch

For this practice, let's add a simple feature: **"Note count display"** - show the total number of notes in the header.

```bash
# Make sure you're on staging branch
git checkout staging
git pull origin staging  # (when remote is set up)

# Create feature branch
git checkout -b feature/note-count-display

# Now you're on feature/note-count-display branch
```

### Step 4: Make Changes

**Feature: Add note count to Notes page header**

We'll modify the Notes component to show the count more prominently.

### Step 5: Commit Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "Add note count display to header

- Display total note count in Notes page header
- Update count after create/delete operations
- Improve user experience"

# Push feature branch
git push -u origin feature/note-count-display
```

### Step 6: Test Locally

```bash
# Start frontend dev server
cd frontend
npm run dev

# Test the feature:
# 1. Create a note
# 2. Verify count updates
# 3. Delete a note
# 4. Verify count updates
```

### Step 7: Create Pull Request (Optional)

If using GitHub/GitLab:

1. Go to repository
2. Create PR: `feature/note-count-display` → `staging`
3. Review changes
4. Merge PR

### Step 8: Merge to Staging

```bash
# Switch to staging branch
git checkout staging

# Pull latest changes (if working with team)
git pull origin staging

# Merge feature branch
git merge feature/note-count-display

# Push staging branch
git push origin staging
```

### Step 9: Deploy to Staging

```bash
# Make sure you're on staging branch
cd infra
git checkout staging  # (if infra is in same repo, or just ensure you're on staging)

# Deploy to staging
NOTES_APP_ENV=staging cdk deploy

# Verify deployment
# Check CloudFormation outputs
# Test in staging environment
```

### Step 10: Test in Staging

1. Access staging environment
2. Test the new feature
3. Verify everything works
4. Check for any issues

### Step 11: Clean Up Feature Branch (Optional)

```bash
# Delete local feature branch
git branch -d feature/note-count-display

# Delete remote feature branch (if pushed)
git push origin --delete feature/note-count-display
```

## What We'll Practice

For this exercise, we'll add a simple feature: **Enhanced note count display**

This is a good practice feature because:

- ✅ Small, focused change
- ✅ Easy to test
- ✅ Low risk
- ✅ Visible improvement

## Next Steps After This

Once you've practiced this workflow:

1. Try with a slightly larger feature
2. Practice the staging → production promotion
3. Set up branch protection rules
4. Add CI/CD automation
