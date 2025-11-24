# Deployment & Branching Strategy for Notes App

## Current State

You have:

- ✅ Working notes app with CRUD functionality
- ✅ Two environments configured: **staging** (us-east-2) and **production** (us-west-2)
- ✅ Environment-specific infrastructure (separate stacks, tables, Lambdas)
- ✅ Single codebase with environment-aware configuration

## Recommended Git Branch Strategy

### Branch Structure

```
main (production)
  ↑
staging (staging)
  ↑
feature/* (development)
```

### Branch Purposes

1. **`main` branch** → Production environment

   - Always deployable to production
   - Only merged from `staging` after testing
   - Protected branch (no direct commits)

2. **`staging` branch** → Staging environment

   - Integration branch for testing
   - Merged from `feature/*` branches
   - Deployed to staging for validation

3. **`feature/*` branches** → Development
   - Individual feature work
   - Examples: `feature/add-search`, `feature/rich-text`
   - Merged into `staging` when ready

## Deployment Workflow

### Phase 1: Development → Staging

```
1. Create feature branch
   git checkout -b feature/add-search

2. Make changes and commit
   git add .
   git commit -m "Add search functionality"

3. Push feature branch
   git push origin feature/add-search

4. Create Pull Request to staging
   (Review, test locally, then merge)

5. Merge to staging
   git checkout staging
   git merge feature/add-search
   git push origin staging

6. Deploy to staging
   cd infra
   git checkout staging
   NOTES_APP_ENV=staging cdk deploy
```

### Phase 2: Staging → Production (Promotion)

```
1. Test thoroughly in staging
   - Manual testing
   - User acceptance testing
   - Performance testing

2. Merge staging → main
   git checkout main
   git merge staging
   git push origin main

3. Deploy to production
   cd infra
   git checkout main
   NOTES_APP_ENV=production cdk deploy
```

## Detailed Workflow

### Daily Development Flow

**Starting a new feature:**

```bash
# 1. Ensure staging is up to date
git checkout staging
git pull origin staging

# 2. Create feature branch from staging
git checkout -b feature/my-feature

# 3. Make changes, commit
git add .
git commit -m "Add feature X"

# 4. Push and create PR
git push origin feature/my-feature
# Create PR: feature/my-feature → staging
```

**After PR is approved:**

```bash
# Merge PR (via GitHub/GitLab UI or locally)
git checkout staging
git merge feature/my-feature
git push origin staging

# Deploy to staging
cd infra
NOTES_APP_ENV=staging cdk deploy
```

### Promotion to Production

**When staging is stable:**

```bash
# 1. Ensure staging is tested and ready
# (Do manual testing, check staging environment)

# 2. Merge staging → main
git checkout main
git pull origin main
git merge staging
git push origin main

# 3. Deploy to production
cd infra
NOTES_APP_ENV=production cdk deploy

# 4. Verify production deployment
# (Check production environment, test critical paths)
```

## Environment-Specific Configuration

### Infrastructure (CDK)

**Current setup:**

- `.env.staging` → Staging config (us-east-2)
- `.env.production` → Production config (us-west-2)
- Same codebase, different config files

**Deployment commands:**

```bash
# Staging
NOTES_APP_ENV=staging cdk deploy

# Production
NOTES_APP_ENV=production cdk deploy
```

### Frontend

**Current setup:**

- `.env.staging` → Staging API URLs
- `.env.production` → Production API URLs
- Build-time environment variables

**For Amplify/CI-CD:**

- Set environment variables in Amplify Console
- Different branches → different environments
- Or use build-time env vars per branch

## Recommended Practices

### 1. Branch Protection Rules

**For `main` branch:**

- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ No force pushes

**For `staging` branch:**

- ✅ Require pull request reviews (optional)
- ✅ Allow force push (for hotfixes)

### 2. Deployment Checklist

**Before deploying to staging:**

- [ ] Code reviewed
- [ ] Tests pass (if you add tests)
- [ ] Local testing done
- [ ] No console errors

**Before promoting to production:**

- [ ] Tested in staging for X days
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Database migrations tested (if any)
- [ ] Rollback plan ready

### 3. Version Tagging

**Tag releases:**

```bash
# After successful production deployment
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

### 4. Hotfix Process

**For urgent production fixes:**

```bash
# 1. Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-bug

# 2. Fix and test
# ... make changes ...

# 3. Merge to both main and staging
git checkout main
git merge hotfix/critical-bug
git push origin main

git checkout staging
git merge hotfix/critical-bug
git push origin staging

# 4. Deploy to production immediately
cd infra
NOTES_APP_ENV=production cdk deploy

# 5. Deploy to staging (to keep in sync)
cd infra
NOTES_APP_ENV=staging cdk deploy
```

## CI/CD Integration (Future)

### Option 1: GitHub Actions / GitLab CI

**Workflow:**

- Push to `staging` → Auto-deploy to staging
- Push to `main` → Auto-deploy to production
- PR to `staging` → Run tests, preview deployment

**Benefits:**

- Automated deployments
- Consistent process
- Deployment history

### Option 2: AWS Amplify (Frontend)

**Setup:**

- Connect GitHub repo
- Configure build settings per branch
- Auto-deploy on push

**Branch mapping:**

- `staging` branch → Staging Amplify app
- `main` branch → Production Amplify app

## Testing Strategy

### 1. Local Testing

- Test features locally before committing
- Use local DynamoDB (optional) or staging API

### 2. Staging Testing

- Deploy to staging after merge
- Manual testing of new features
- Integration testing
- User acceptance testing

### 3. Production Testing

- Smoke tests after deployment
- Monitor for errors
- Check critical user flows

## Rollback Strategy

### Infrastructure Rollback

**If deployment fails:**

```bash
# CDK keeps previous stack version
# Simply redeploy previous working version
cd infra
git checkout <previous-commit>
NOTES_APP_ENV=production cdk deploy
```

**Or use CDK rollback:**

```bash
# CDK can rollback to previous successful deployment
cdk rollback
```

### Database Considerations

- **DynamoDB**: No migrations needed (schema-less)
- **Data**: Point-in-time recovery enabled
- **Backup**: Consider regular backups for production

## Environment Parity

### Keep Environments Similar

- ✅ Same infrastructure code
- ✅ Same application code
- ✅ Different configuration (accounts, regions, URLs)
- ⚠️ Different data (staging vs production)

### Configuration Management

**Infrastructure:**

- `.env.staging` and `.env.production` in `.gitignore`
- Use environment-specific values
- Document required variables

**Frontend:**

- `.env.staging` and `.env.production` in `.gitignore`
- Set in CI/CD or Amplify Console
- Document required variables

## Next Steps (Implementation Order)

### Phase 1: Basic Branching (Start Here)

1. Create `staging` branch
2. Set up branch protection for `main`
3. Practice feature → staging → main flow

### Phase 2: Deployment Automation

1. Set up GitHub Actions / CI-CD
2. Automate staging deployments
3. Automate production deployments (with approval)

### Phase 3: Advanced Features

1. Add automated testing
2. Set up monitoring/alerting
3. Implement blue-green deployments (optional)

## Example: Complete Feature Lifecycle

**Feature: Add search functionality**

```bash
# Day 1: Start feature
git checkout staging
git pull
git checkout -b feature/add-search

# ... code changes ...
git commit -m "Add search UI"
git commit -m "Add search API integration"
git push origin feature/add-search

# Day 2: Create PR and review
# (Create PR: feature/add-search → staging)
# (Get code review, make changes)

# Day 3: Merge to staging
git checkout staging
git merge feature/add-search
git push origin staging

# Deploy to staging
cd infra
NOTES_APP_ENV=staging cdk deploy

# Test in staging for 2-3 days

# Day 5: Promote to production
git checkout main
git merge staging
git push origin main

# Deploy to production
cd infra
NOTES_APP_ENV=production cdk deploy

# Verify production
# Tag release
git tag -a v1.1.0 -m "Add search functionality"
git push origin v1.1.0
```

## Key Principles

1. **Never deploy directly to production** - Always go through staging
2. **Test in staging first** - Catch issues before production
3. **Keep environments in sync** - Same code, different configs
4. **Document deployments** - Know what's deployed where
5. **Have a rollback plan** - Always be ready to revert

## Questions to Consider

1. **How long to test in staging?**

   - Small changes: 1-2 days
   - Major features: 3-7 days
   - Critical changes: 1-2 weeks

2. **When to create releases?**

   - After each production deployment
   - Weekly releases
   - Feature-based releases

3. **How to handle database changes?**

   - Currently: No migrations (DynamoDB is schema-less)
   - Future: Document schema changes, use migrations if needed

4. **Monitoring strategy?**
   - CloudWatch for Lambda logs
   - API Gateway metrics
   - Frontend error tracking (optional)

This strategy gives you a solid foundation for managing multi-environment deployments while learning best practices! 🚀
