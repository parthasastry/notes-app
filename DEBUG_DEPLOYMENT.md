# Debugging: GitHub Actions Shows Success But No CloudFormation

## Quick Checks

### 1. Check Which AWS Account/Region

**The workflow deploys to:**

- **Account**: Uses `STAGING_ACCOUNT_ID` secret
- **Region**: `us-east-2`

**Verify you're looking in the right place:**

1. Check AWS Console top-right corner → Account ID should match your staging account
2. Check region selector → Should be `us-east-2` (Ohio)

### 2. Check Workflow Logs

**In GitHub Actions:**

1. Go to: `https://github.com/parthasastry/notes-app/actions`
2. Click on the successful "Deploy to Staging" run
3. Click on the "deploy" job
4. Expand the "Deploy infrastructure" step
5. **Look for:**
   - CDK output messages
   - Stack creation/update messages
   - Any errors or warnings

**What to look for in logs:**

```
✅ Good signs:
- "NotesAppStackStaging"
- "Stack deployed successfully"
- CloudFormation stack ID
- Resource creation messages

❌ Bad signs:
- "No changes" (stack already up to date)
- "Error:"
- "Failed to assume role"
- "Access denied"
```

### 3. Check CloudFormation Stacks

**In AWS Console:**

1. Go to: CloudFormation → Stacks
2. **Filter by:**
   - Region: `us-east-2`
   - Status: All
3. **Look for:**
   - `NotesAppStackStaging`
   - `NotesAppStackStaging-Database-*`
   - `NotesAppStackStaging-Lambdas-*`
   - `NotesAppStackStaging-Cognito-*`
   - `NotesAppStackStaging-ApiGateway-*`

**If you see stacks:**

- Check their status (CREATE_COMPLETE, UPDATE_COMPLETE, etc.)
- Check the "Events" tab to see what happened

**If you don't see stacks:**

- The deployment might not have actually run
- Check workflow logs for errors

### 4. Check AWS Credentials

**Verify secrets are correct:**

1. Go to GitHub: Repository → Settings → Secrets → Actions
2. Check these secrets exist:
   - `STAGING_ACCESS_KEY_ID`
   - `STAGING_SECRET_ACCESS_KEY`
   - `STAGING_ACCOUNT_ID`

**Test credentials manually:**

```bash
# Set credentials
export AWS_ACCESS_KEY_ID=<your-staging-access-key>
export AWS_SECRET_ACCESS_KEY=<your-staging-secret-key>
export AWS_DEFAULT_REGION=us-east-2

# Test access
aws sts get-caller-identity

# Should show your staging account ID
```

### 5. Check CDK Bootstrap

**CDK needs to be bootstrapped before first deployment:**

```bash
# Make sure you're authenticated to staging account
aws sts get-caller-identity

# Bootstrap CDK
cd infra
NOTES_APP_ENV=staging npx cdk bootstrap aws://STAGING_ACCOUNT_ID/us-east-2
```

**Check if bootstrap exists:**

```bash
# In AWS Console → CloudFormation
# Look for stack: CDKToolkit
# Should exist in us-east-2 region
```

### 6. Common Issues

#### Issue: "No changes" in logs

**Symptom:** Workflow succeeds but says "No changes to deploy"

**Solution:**

- This means CDK thinks everything is already deployed
- Check CloudFormation for existing stacks
- Or make a change to infrastructure code to force deployment

#### Issue: Wrong AWS account

**Symptom:** Looking in wrong account

**Solution:**

- Verify `STAGING_ACCOUNT_ID` secret matches the account you're checking
- Make sure you're logged into the staging AWS account in console

#### Issue: Wrong region

**Symptom:** Looking in wrong region

**Solution:**

- Workflow deploys to `us-east-2` (Ohio)
- Make sure you're looking in that region in AWS Console

#### Issue: Credentials don't have permissions

**Symptom:** Workflow succeeds but deployment step fails silently

**Solution:**

- Check IAM user has CloudFormation permissions
- Check workflow logs for "AccessDenied" errors
- Verify IAM policy includes `cloudformation:*`

#### Issue: CDK not bootstrapped

**Symptom:** CDK deploy fails with bootstrap error

**Solution:**

- Run `cdk bootstrap` for staging account
- See Step 5 above

### 7. Force a New Deployment

**To trigger a fresh deployment:**

1. **Make a small change to infrastructure:**

   ```bash
   # Edit any file in infra/lib/
   # Add a comment or change a value
   ```

2. **Commit and push:**

   ```bash
   git add infra/
   git commit -m "Trigger deployment"
   git push origin staging
   ```

3. **Or trigger via empty commit:**
   ```bash
   git commit --allow-empty -m "Trigger staging deployment"
   git push origin staging
   ```

### 8. Check Workflow Step-by-Step

**In GitHub Actions logs, verify each step:**

1. ✅ **Checkout code** - Should show files checked out
2. ✅ **Setup Node.js** - Should show Node version
3. ✅ **Configure AWS credentials** - Should show region
4. ✅ **Install dependencies** - Should show npm install
5. ✅ **Build TypeScript** - Should show compilation
6. ✅ **Deploy infrastructure** - **This is the key step!**

**In the "Deploy infrastructure" step, you should see:**

```
NotesAppStackStaging: deploying...
NotesAppStackStaging: creating CloudFormation changeset...
NotesAppStackStaging: creating stack...
NotesAppStackStaging: ✅ Stack deployed successfully
```

**If you don't see these messages, the deployment didn't run.**

### 9. Manual Test

**Test deployment manually to verify setup:**

```bash
# Set environment variables
export NOTES_APP_ENV=staging
export CDK_DEFAULT_ACCOUNT=<your-staging-account-id>
export CDK_DEFAULT_REGION=us-east-2
export AWS_ACCESS_KEY_ID=<your-staging-access-key>
export AWS_SECRET_ACCESS_KEY=<your-staging-secret-key>

# Navigate to infra
cd infra

# Install dependencies
npm ci

# Build
npm run build

# Deploy
npx cdk deploy --all --require-approval never
```

**This should:**

- Show CloudFormation stack creation
- Create resources in AWS
- Show success message

**If this works but GitHub Actions doesn't:**

- There's an issue with secrets or workflow configuration
- Check secret names match exactly

### 10. Verify Stack Names

**CDK creates stacks with these names:**

- Main stack: `NotesAppStackStaging`
- Nested stacks: `NotesAppStackStaging-*`

**In CloudFormation, filter by:**

- Stack name contains: `NotesAppStackStaging`
- Region: `us-east-2`

---

## Quick Checklist

- [ ] Checked AWS Console in **us-east-2** region
- [ ] Checked AWS Console with **staging account** logged in
- [ ] Checked CloudFormation → Stacks (not just Resources)
- [ ] Checked workflow logs for "Deploy infrastructure" step
- [ ] Verified secrets are set correctly in GitHub
- [ ] Verified CDK is bootstrapped in staging account
- [ ] Checked IAM user has CloudFormation permissions
- [ ] Tried manual deployment to verify setup

---

## Next Steps

1. **Check workflow logs** - Look at the "Deploy infrastructure" step output
2. **Check CloudFormation** - Look in us-east-2 region, staging account
3. **Share the logs** - If still stuck, share the workflow log output from the deploy step
