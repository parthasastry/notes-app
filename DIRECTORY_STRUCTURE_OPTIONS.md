# Directory Structure Options for Multi-Environment Setup

## Option 1A: Single Infrastructure Directory (Recommended for Practice) ✅

**Structure:**

```
notes-app/
├── infra/                    # Single CDK infrastructure directory
│   ├── bin/
│   │   └── infra.ts         # Entry point (loads .env files)
│   ├── lib/
│   │   ├── infra-stack.ts   # Main stack (environment-aware)
│   │   ├── cognito-stack.ts
│   │   ├── dynamodb-stack.ts
│   │   └── lambda-stack.ts
│   ├── .env                 # Base config (optional)
│   ├── .env.staging         # Staging: CDK_DEFAULT_ACCOUNT, CDK_DEFAULT_REGION
│   ├── .env.production      # Production: CDK_DEFAULT_ACCOUNT, CDK_DEFAULT_REGION
│   └── package.json
│
├── backend/                  # Shared backend code
│   └── lambda/
│       └── cognito-triggers/
│           └── post-confirmation/
│               ├── index.mjs
│               └── package.json
│
└── frontend/                 # Shared frontend code
    ├── src/
    ├── .env.staging          # Staging frontend config
    ├── .env.production       # Production frontend config
    └── package.json
```

**Deployment:**

```bash
# Deploy staging
cd infra
NOTES_APP_ENV=staging cdk deploy

# Deploy production
cd infra
NOTES_APP_ENV=production cdk deploy
```

**Pros:**

- ✅ Single source of truth for infrastructure code
- ✅ Easy to keep environments in sync
- ✅ Less code duplication
- ✅ Simpler maintenance
- ✅ Perfect for learning/practice

**Cons:**

- ⚠️ Same stack name for both environments (must use different AWS accounts/regions)
- ⚠️ Can't deploy both simultaneously to same account

---

## Option 1B: Separate Infrastructure Directories

**Structure:**

```
notes-app/
├── infra-staging/            # Staging infrastructure
│   ├── bin/
│   │   └── infra.ts
│   ├── lib/
│   │   └── infra-stack.ts
│   ├── .env                  # Staging-specific config
│   └── package.json
│
├── infra-prod/               # Production infrastructure
│   ├── bin/
│   │   └── infra.ts
│   ├── lib/
│   │   └── infra-stack.ts
│   ├── .env                  # Production-specific config
│   └── package.json
│
├── backend/                  # Shared backend code
│   └── lambda/
│       └── cognito-triggers/
│           └── post-confirmation/
│               ├── index.mjs
│               └── package.json
│
└── frontend/                 # Shared frontend code
    ├── src/
    ├── .env.staging
    ├── .env.production
    └── package.json
```

**Deployment:**

```bash
# Deploy staging
cd infra-staging
cdk deploy

# Deploy production
cd infra-prod
cdk deploy
```

**Pros:**

- ✅ Complete isolation between environments
- ✅ Can have different stack names in same account
- ✅ Can deploy simultaneously
- ✅ Clear separation

**Cons:**

- ❌ Code duplication (infra code in two places)
- ❌ Harder to keep environments in sync
- ❌ More complex maintenance
- ❌ More overhead for a practice app

---

## Recommendation: Option 1A (Single Directory)

For your practice notes app, **use Option 1A** because:

1. **You're learning** - Simpler structure = easier to understand
2. **Same patterns** - Matches what you'd use in production
3. **Less duplication** - Infrastructure code stays DRY
4. **Easier maintenance** - Fix bugs once, not twice

You can always refactor to Option 1B later if needed!

---

## How Resources Are Named (Option 1A)

With a single `infra/` directory, resources are prefixed by environment:

**Staging resources:**

- DynamoDB: `notes-app-staging-users`
- Cognito: `notes-app-staging-users` (User Pool)
- Lambda: `notes-app-staging-post-confirmation`

**Production resources:**

- DynamoDB: `notes-app-production-users`
- Cognito: `notes-app-production-users` (User Pool)
- Lambda: `notes-app-production-post-confirmation`

This allows both environments to coexist in the same AWS account!

---

## Example Workflow (Option 1A)

```bash
# 1. Setup staging environment
cd infra
cp .env.staging.template .env.staging
# Edit .env.staging with staging account/region

# 2. Deploy staging
NOTES_APP_ENV=staging cdk synth  # Preview
NOTES_APP_ENV=staging cdk deploy  # Deploy

# 3. Test staging
# ... test your app in staging ...

# 4. Setup production (when ready)
cp .env.production.template .env.production
# Edit .env.production with production account/region

# 5. Deploy production
NOTES_APP_ENV=production cdk synth
NOTES_APP_ENV=production cdk deploy
```

---

## Which Option to Choose?

**Use Option 1A if:**

- ✅ Learning/practicing (your case!)
- ✅ Small team
- ✅ Same infrastructure code for both environments
- ✅ Want to minimize duplication

**Use Option 1B if:**

- ✅ Need completely different infrastructure per environment
- ✅ Large team with separate ownership
- ✅ Must deploy simultaneously to same account
- ✅ Willing to maintain duplicate code

For your practice app, **Option 1A is perfect**! 🎯
