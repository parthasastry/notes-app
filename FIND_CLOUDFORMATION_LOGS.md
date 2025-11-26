# Finding CloudFormation Logs/Events

## The "Ghost" Explained

Your deployment **IS working** - you're seeing changes in AWS! The CloudFormation events are there, but you might be looking in the wrong place or they're filtered out.

---

## Where to Find CloudFormation Events

### Step 1: Find the Main Stack

**In AWS Console → CloudFormation:**

1. Go to: **CloudFormation** → **Stacks**
2. **Region**: Make sure you're in `us-east-2` (Ohio)
3. **Look for**: `NotesAppStackStaging`

**This is your main stack** - all events will be here!

### Step 2: View Events

1. **Click on** `NotesAppStackStaging` stack
2. **Click the "Events" tab** (not "Resources" or "Outputs")
3. **You should see:**
   - List of all stack operations
   - Timestamps for each event
   - Status (CREATE_COMPLETE, UPDATE_COMPLETE, etc.)
   - Resource being created/updated

### Step 3: Check Event Filters

**Common issue:** Events might be filtered!

1. In the Events tab, look for **filter options**
2. **Make sure:**
   - Status filter shows "All" (not just "Failed")
   - Time range includes recent deployments
   - No resource type filters are applied

### Step 4: Check Nested Stacks (If Any)

CDK sometimes creates **nested stacks**. Check:

1. In the main stack (`NotesAppStackStaging`)
2. Go to **"Resources" tab**
3. Look for resources with type: `AWS::CloudFormation::Stack`
4. These are nested stacks - click on them to see their events

---

## Understanding Your Stack Structure

### Your CDK Structure

```
NotesAppStackStaging (Main Stack)
├── Database (Construct - part of main stack)
├── Lambdas (Construct - part of main stack)
├── Cognito (Construct - part of main stack)
└── ApiGateway (Construct - part of main stack)
```

**Important:** These are **Constructs**, not separate stacks. All events appear in the main `NotesAppStackStaging` stack.

### What You'll See in Events

**For each deployment, you'll see events like:**

```
Resource: NotesAppStackStaging
Status: UPDATE_IN_PROGRESS
Time: 2024-01-15 10:30:00

Resource: NotesAppStackStaging-UsersTable-XXXXX
Status: UPDATE_COMPLETE
Time: 2024-01-15 10:30:15

Resource: NotesAppStackStaging-NotesTable-XXXXX
Status: UPDATE_COMPLETE
Time: 2024-01-15 10:30:20

Resource: NotesAppStackStaging-NotesApiLambda-XXXXX
Status: UPDATE_COMPLETE
Time: 2024-01-15 10:30:45
```

---

## Why Events Might Seem "Ghostly"

### Issue 1: Looking at Wrong Stack

**Problem:** Looking at a different stack or wrong region

**Solution:**

- Verify stack name: `NotesAppStackStaging`
- Verify region: `us-east-2`
- Verify account: Your staging AWS account

### Issue 2: Events Filtered Out

**Problem:** Events tab has filters applied

**Solution:**

1. Clear all filters
2. Set time range to "All time" or last 7 days
3. Make sure status shows "All events"

### Issue 3: "No Changes" Deployments

**Problem:** If CDK says "No changes", there won't be new events

**Solution:**

- Check if the last event is old
- Make a real change to infrastructure to see new events
- Check GitHub Actions logs - does it say "No changes"?

### Issue 4: Looking at Resources Instead of Events

**Problem:** Looking at Resources tab instead of Events tab

**Solution:**

- Make sure you're on the **"Events"** tab
- Events show the history of changes
- Resources show current state

### Issue 5: Time Zone Confusion

**Problem:** Events use UTC time, might look old

**Solution:**

- Events are in UTC
- Convert to your local time
- Check the most recent events at the top

---

## How to Verify Events Are Being Created

### Method 1: Make a Change and Watch

1. **Make a small change** to infrastructure:

   ```typescript
   // In infra/lib/dynamodb-stack.ts
   // Add a tag or comment
   ```

2. **Deploy:**

   ```bash
   git add infra/
   git commit -m "Test deployment"
   git push origin staging
   ```

3. **Watch CloudFormation:**
   - Go to CloudFormation → Stacks → `NotesAppStackStaging`
   - Click "Events" tab
   - **Refresh the page** (events update in real-time)
   - You should see new events appear!

### Method 2: Check Stack Status

1. **In CloudFormation → Stacks**
2. **Look at the "Status" column** for `NotesAppStackStaging`
3. **Should show:**
   - `UPDATE_COMPLETE` (after successful deployment)
   - `UPDATE_IN_PROGRESS` (during deployment)
   - `CREATE_COMPLETE` (if it was just created)

### Method 3: Check Stack History

1. **Click on** `NotesAppStackStaging` stack
2. **Go to "Stack info" tab**
3. **Look at:**
   - Last updated time
   - Stack status
   - Should match your recent deployments

---

## Finding Events for Specific Deployments

### Match GitHub Actions to CloudFormation

1. **In GitHub Actions:**

   - Note the deployment time
   - Note the commit hash

2. **In CloudFormation Events:**
   - Look for events around that time
   - Events are in UTC, so convert if needed
   - Should see UPDATE_IN_PROGRESS → UPDATE_COMPLETE

### Check Change Sets

1. **In CloudFormation → Stacks → `NotesAppStackStaging`**
2. **Go to "Change sets" tab**
3. **You'll see:**
   - History of all changes
   - What was changed in each deployment
   - Status of each change set

---

## Quick Checklist

- [ ] Looking at **CloudFormation** service (not other services)
- [ ] In **`us-east-2`** region
- [ ] Looking at **`NotesAppStackStaging`** stack
- [ ] On the **"Events"** tab (not Resources or Outputs)
- [ ] **No filters** applied to events
- [ ] **Time range** includes recent deployments
- [ ] **Refreshing** the page to see latest events

---

## Alternative: Check via AWS CLI

**If you can't find events in console, use CLI:**

```bash
# List recent stack events
aws cloudformation describe-stack-events \
  --stack-name NotesAppStackStaging \
  --region us-east-2 \
  --max-items 20

# This shows the 20 most recent events
```

**Or get stack status:**

```bash
aws cloudformation describe-stacks \
  --stack-name NotesAppStackStaging \
  --region us-east-2 \
  --query 'Stacks[0].[StackStatus,LastUpdatedTime]'
```

---

## Understanding Event Types

**Common events you'll see:**

- `CREATE_IN_PROGRESS` - Stack/resource being created
- `CREATE_COMPLETE` - Stack/resource created successfully
- `UPDATE_IN_PROGRESS` - Stack/resource being updated
- `UPDATE_COMPLETE` - Stack/resource updated successfully
- `UPDATE_COMPLETE_CLEANUP_IN_PROGRESS` - Cleaning up after update
- `DELETE_IN_PROGRESS` - Stack/resource being deleted

**For successful deployments, you'll see:**

- `UPDATE_IN_PROGRESS` → `UPDATE_COMPLETE` (for each resource)
- Final status: `UPDATE_COMPLETE` for the stack

---

## Pro Tips

1. **Bookmark the Events tab** - Quick access to deployment history
2. **Use Change Sets** - See what changed in each deployment
3. **Check Stack Drift** - Verify resources match the template
4. **Enable CloudTrail** - Get detailed API call logs (if needed)

---

## Summary

**The events are NOT ghosts - they're real!** You just need to:

1. ✅ Go to **CloudFormation → Stacks**
2. ✅ Click on **`NotesAppStackStaging`**
3. ✅ Click **"Events"** tab
4. ✅ **Clear filters** and check time range
5. ✅ **Refresh** to see latest events

**If you still don't see events:**

- Check you're in the right region (`us-east-2`)
- Check you're in the right AWS account
- Make a new deployment and watch events appear in real-time
- Use AWS CLI to verify events exist

The events are there - you just need to look in the right place! 👻 → ✅
