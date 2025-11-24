# Cognito & User Setup - Notes App

## What's Been Created

1. **DynamoDB Users Table** - Stores user profiles (`notes-app-{env}-users`)
2. **Cognito User Pool** - Manages user authentication (`notes-app-{env}-users`)
3. **Cognito User Pool Client** - Web client for authentication (`notes-app-{env}-web-client`)
4. **Post-Confirmation Lambda** - Creates user record in DynamoDB after email verification

All resources are **environment-aware** and will be prefixed with the environment (staging/production).

---

## Setup Steps

### 1. Install Lambda Dependencies

```bash
cd backend/lambda/cognito-triggers/post-confirmation
npm install
```

This installs the AWS SDK dependencies needed for the Lambda function.

### 2. Build CDK Infrastructure

```bash
cd ../../../infra
npm run build
```

### 3. Deploy Staging Environment

```bash
ENVIRONMENT=staging cdk deploy
```

This will create:

- `NotesAppStack-staging`
- DynamoDB table: `notes-app-staging-users`
- Cognito User Pool: `notes-app-staging-users`
- Lambda function: `notes-app-staging-post-confirmation`

### 4. Deploy Production Environment

```bash
ENVIRONMENT=production cdk deploy
```

This will create separate resources:

- `NotesAppStack-production`
- DynamoDB table: `notes-app-production-users`
- Cognito User Pool: `notes-app-production-users`
- Lambda function: `notes-app-production-post-confirmation`

---

## Resource Structure

### DynamoDB Users Table Schema

**Table Name:** `notes-app-{environment}-users`

**Partition Key:** `email` (String)

**Attributes:**

```typescript
{
  email: string,                    // PK
  cognito_sub: string,              // Cognito user ID
  name: string,
  given_name: string,
  family_name: string,
  account_status: 'active',
  profile: {
    notes_count: number,
    last_note_date: string | null,
  },
  last_login: string,
  created_at: string,
  updated_at: string,
}
```

### Cognito Configuration

- **Sign-in method:** Email only
- **Self-signup:** Enabled
- **Email verification:** Required (automatic)
- **Password policy:**
  - Minimum 8 characters
  - Requires lowercase
  - Requires uppercase
  - Requires digits
  - No symbols required
- **MFA:** Disabled (can be enabled later)
- **Account recovery:** Email only

---

## CDK Outputs

After deployment, you'll get these outputs:

### Staging Environment:

- `NotesApp-staging-UserPoolId` - User Pool ID
- `NotesApp-staging-UserPoolClientId` - Client ID (needed for frontend)
- `NotesApp-staging-UsersTableName` - DynamoDB table name

### Production Environment:

- `NotesApp-production-UserPoolId` - User Pool ID
- `NotesApp-production-UserPoolClientId` - Client ID (needed for frontend)
- `NotesApp-production-UsersTableName` - DynamoDB table name

---

## Frontend Integration

You'll need these values in your frontend `.env` files:

**`.env.staging`:**

```env
VITE_USER_POOL_ID=<staging-user-pool-id>
VITE_USER_POOL_CLIENT_ID=<staging-client-id>
VITE_AWS_REGION=us-east-2
```

**`.env.production`:**

```env
VITE_USER_POOL_ID=<production-user-pool-id>
VITE_USER_POOL_CLIENT_ID=<production-client-id>
VITE_AWS_REGION=us-east-2
```

---

## How It Works

### User Signup Flow:

1. User signs up via frontend → Cognito User Pool
2. User receives email verification link
3. User clicks link → Email confirmed
4. **Post-Confirmation Lambda triggered**
5. Lambda creates user record in DynamoDB
6. User can now log in

### Important Notes:

- If DynamoDB write fails, user can still log in (Lambda doesn't break Cognito flow)
- Duplicate users are prevented (ConditionalCheckFailedException handled)
- User data is protected (RETAIN removal policy)

---

## Testing

### Test Post-Confirmation Lambda Locally:

Create `test-event.json`:

```json
{
  "request": {
    "userAttributes": {
      "sub": "test-sub-123",
      "email": "test@example.com",
      "given_name": "Test",
      "family_name": "User"
    }
  },
  "userName": "test-user"
}
```

Test with AWS CLI (after deployment):

```bash
aws lambda invoke \
  --function-name notes-app-staging-post-confirmation \
  --payload file://test-event.json \
  response.json

cat response.json
```

---

## Next Steps

1. ✅ Cognito & DynamoDB setup complete
2. ⏳ Deploy infrastructure
3. ⏳ Configure frontend with Cognito credentials
4. ⏳ Build authentication UI
5. ⏳ Test user signup/login flow
