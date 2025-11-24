# Environment Variable Sources - Clarification

## The Confusion

You might think `process.env.TABLE_NOTES` comes from:

- ❌ A `.env` file in the Lambda function directory
- ❌ Directly from `dynamodb-stack.ts`

**Actually, it comes from neither!** It comes from the **Lambda function's runtime environment variables** set by AWS CDK.

## Three Different Types of Environment Variables

### 1. CDK Deployment Environment Variables (`.env` files)

**Location:** `infra/.env`, `infra/.env.staging`, `infra/.env.production`

**Used by:** CDK during deployment (`cdk deploy`)

**Purpose:** Configure CDK deployment settings

```bash
# infra/.env.staging
CDK_DEFAULT_ACCOUNT=221894468355
CDK_DEFAULT_REGION=us-east-2
NOTES_APP_ENV=staging
```

**When used:** When you run `cdk deploy` or `cdk synth`

**NOT used by:** Lambda functions at runtime

---

### 2. Lambda Runtime Environment Variables (Set by CDK)

**Location:** Set in `lambda-stack.ts` when creating the Lambda function

**Used by:** Lambda function at runtime (`process.env.TABLE_NOTES`)

**Purpose:** Provide runtime configuration to Lambda functions

**How it's set:**

```typescript
// infra/lib/lambda-stack.ts
this.notesApiLambda = new lambda.Function(this, "NotesApiLambda", {
  // ...
  environment: {
    TABLE_NOTES: props.notesTable.tableName, // ← This sets the Lambda's env var
  },
});
```

**What happens:**

1. CDK reads `props.notesTable.tableName` (from DynamoDB stack)
2. CDK sets this as an environment variable on the Lambda function
3. When Lambda runs, `process.env.TABLE_NOTES` reads this value

**Where it's stored:** In AWS Lambda function configuration (not in a file)

---

### 3. Local Development Environment Variables (`.env` files in Lambda)

**Location:** `backend/lambda/notes-api/.env` (if you create one)

**Used by:** Only if you run the Lambda locally (e.g., with SAM, Serverless, or local testing)

**Purpose:** Override environment variables for local development

**NOT used by:** Deployed Lambda functions in AWS

---

## The Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CDK Deployment Time (uses .env files)                   │
│                                                              │
│    infra/.env.staging                                       │
│    ├─ CDK_DEFAULT_ACCOUNT=221894468355                      │
│    ├─ CDK_DEFAULT_REGION=us-east-2                          │
│    └─ NOTES_APP_ENV=staging                                 │
│                                                              │
│    ↓ Used by CDK to determine deployment settings           │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ CDK reads these
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. CDK Synthesizes Infrastructure                            │
│                                                              │
│    DynamoDB Stack:                                          │
│    └─ Creates table: "notes-app-staging-notes"              │
│                                                              │
│    Lambda Stack:                                            │
│    └─ Sets Lambda env var: TABLE_NOTES="notes-app-staging-notes"│
│                                                              │
│    ↓ This becomes CloudFormation template                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ AWS creates resources
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Lambda Runtime (reads from AWS Lambda config)             │
│                                                              │
│    Lambda Function Configuration:                           │
│    └─ Environment Variables:                                │
│       └─ TABLE_NOTES = "notes-app-staging-notes"            │
│                                                              │
│    Lambda Code:                                             │
│    └─ const notesTable = process.env.TABLE_NOTES;           │
│       // Reads from AWS Lambda's environment variables      │
│                                                              │
│    ↓ NOT from .env file, NOT directly from CDK code         │
└─────────────────────────────────────────────────────────────┘
```

## Key Points

### ✅ What `process.env.TABLE_NOTES` Reads From:

**AWS Lambda Function Configuration** (set by CDK during deployment)

- Stored in AWS Lambda service
- Set when Lambda function is created/updated
- Persists across Lambda invocations
- Can be viewed in AWS Console: Lambda → Configuration → Environment variables

### ❌ What It Does NOT Read From:

1. **`.env` files in `infra/` directory**

   - These are only for CDK deployment configuration
   - Lambda functions never see these

2. **`.env` files in `backend/lambda/notes-api/`**

   - Only used for local development/testing
   - Deployed Lambda functions don't use these

3. **Directly from `dynamodb-stack.ts`**
   - The stack provides the table name to Lambda stack
   - But Lambda stack sets it as an environment variable
   - Lambda reads from its own runtime environment, not from CDK code

## Verification

### Check Lambda Environment Variables in AWS Console:

1. Go to AWS Lambda Console
2. Select: `notes-app-staging-notes-api`
3. Go to: **Configuration** → **Environment variables**
4. You'll see:
   ```
   TABLE_NOTES = notes-app-staging-notes
   ```

### Check via AWS CLI:

```bash
aws lambda get-function-configuration \
  --function-name notes-app-staging-notes-api \
  --query 'Environment.Variables'
```

Output:

```json
{
  "TABLE_NOTES": "notes-app-staging-notes"
}
```

### Check in Lambda Code:

```javascript
// backend/lambda/notes-api/index.mjs
console.log("TABLE_NOTES:", process.env.TABLE_NOTES);
// This will log: "notes-app-staging-notes"
// But it's reading from AWS Lambda's environment variables, not a file!
```

## Summary

| Source                               | Used By               | Purpose                                                   |
| ------------------------------------ | --------------------- | --------------------------------------------------------- |
| `infra/.env*` files                  | CDK during deployment | Configure CDK (account, region, environment)              |
| `lambda-stack.ts` environment config | AWS Lambda at runtime | Set Lambda's runtime environment variables                |
| `process.env.TABLE_NOTES` in Lambda  | Lambda function code  | Read from AWS Lambda's environment variables (set by CDK) |

**The answer:** `process.env.TABLE_NOTES` reads from **AWS Lambda's runtime environment variables**, which are **set by CDK** (using the table name from DynamoDB stack), **not from a `.env` file**.
