# Environment Setup Guide

## Overview

The CDK infrastructure now supports multiple environments (staging and production) using environment-specific configuration files.

## Setup

### 1. Install Dependencies

```bash
cd infra
npm install
```

This will install `dotenv` which is needed to load environment-specific `.env` files.

### 2. Create Environment Files

Create environment-specific `.env` files in the `infra/` directory:

**`.env.staging`** (for staging environment):

```env
ENVIRONMENT=staging
CDK_DEFAULT_ACCOUNT=your-aws-account-id
CDK_DEFAULT_REGION=us-east-2
```

**`.env.production`** (for production environment):

```env
ENVIRONMENT=production
CDK_DEFAULT_ACCOUNT=your-aws-account-id
CDK_DEFAULT_REGION=us-east-2
```

**`.env`** (optional fallback):

```env
CDK_DEFAULT_ACCOUNT=your-aws-account-id
CDK_DEFAULT_REGION=us-east-2
```

### 3. Deployment

#### Deploy Staging Environment

```bash
cd infra
ENVIRONMENT=staging cdk deploy
```

This will:

- Load `.env.staging` file
- Create/update stack named `NotesAppStack-staging`
- Deploy resources prefixed with environment name

#### Deploy Production Environment

```bash
cd infra
ENVIRONMENT=production cdk deploy
```

This will:

- Load `.env.production` file
- Create/update stack named `NotesAppStack-production`
- Deploy resources prefixed with environment name

#### Default Behavior

If `ENVIRONMENT` is not set, it defaults to `staging`:

```bash
cd infra
cdk deploy  # Deploys to staging by default
```

### 4. Preview Changes

Before deploying, preview what will change:

```bash
ENVIRONMENT=staging cdk diff
ENVIRONMENT=production cdk diff
```

## Resource Naming Convention

All resources should use the environment in their names:

```typescript
// In your stack constructs
const tableName = `notes-app-${this.environment}-users`;
const lambdaName = `notes-app-${this.environment}-api`;
```

Examples:

- Staging: `notes-app-staging-users-table`
- Production: `notes-app-production-users-table`

## Environment Variable Access

In your stack code, access the environment like this:

```typescript
export class NotesAppStack extends cdk.Stack {
  public readonly environment: string;

  constructor(scope: Construct, id: string, props: NotesAppStackProps) {
    super(scope, id, props);
    this.environment = props.environment;

    // Use this.environment for naming, configuration, etc.
    console.log(`Deploying to: ${this.environment}`);
  }
}
```

## Stack Outputs

Each stack will output the environment name:

- `NotesAppStack-staging` outputs: `Environment = staging`
- `NotesAppStack-production` outputs: `Environment = production`

## Best Practices

1. **Never deploy to production without testing in staging first**
2. **Always use `cdk diff` before deploying**
3. **Keep `.env*` files in `.gitignore`** (already configured)
4. **Use environment-specific AWS accounts if possible** (future enhancement)
5. **Test both environments can coexist** (same account, different stacks)

## Troubleshooting

### Error: Cannot find module 'dotenv'

**Solution**: Run `npm install` in the `infra/` directory

### Error: Environment file not found

**Solution**: Create the `.env.staging` or `.env.production` file in `infra/` directory

### Stacks overwrite each other

**Solution**: Make sure you're using environment-specific stack names (now handled automatically)

### Wrong environment deployed

**Solution**: Check that `ENVIRONMENT` variable is set correctly:

```bash
echo $ENVIRONMENT  # Should show 'staging' or 'production'
```
