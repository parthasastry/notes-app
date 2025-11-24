# Debugging Notes API Issues

## Symptoms

- Unable to add notes
- Backend table is empty
- CloudWatch logs are empty

## Debugging Steps

### 1. Check API URL Configuration

**Frontend `.env` file should have:**

```env
VITE_API_BASE_URL=https://your-api-id.execute-api.us-east-2.amazonaws.com/prod
```

**To get the API URL:**

```bash
cd infra
NOTES_APP_ENV=staging cdk deploy

# Get API URL from outputs
aws cloudformation describe-stacks \
  --stack-name NotesAppStackStaging \
  --query 'Stacks[0].Outputs[?OutputKey==`NotesAppStackStaging-ApiUrl`].OutputValue' \
  --output text
```

### 2. Check Browser Console

Open browser DevTools (F12) and check:

- **Console tab**: Look for API errors
- **Network tab**: Check if requests are being made
  - Look for requests to `/notes` endpoint
  - Check request headers (should have `Authorization: Bearer ...`)
  - Check response status codes

### 3. Check Lambda Function

**Check if Lambda is being invoked:**

```bash
# Get Lambda function name
aws lambda list-functions \
  --query 'Functions[?contains(FunctionName, `notes-api`)].FunctionName' \
  --output text

# Check recent invocations
aws logs tail /aws/lambda/notes-app-staging-notes-api --follow
```

### 4. Check API Gateway Logs

**Enable API Gateway logging:**

1. Go to API Gateway Console
2. Select your API: `notes-app-staging-api`
3. Go to Settings → Enable CloudWatch Log Role ARN
4. Go to Stages → `prod` → Logs/Tracing → Enable CloudWatch Logs

**Check logs:**

```bash
aws logs tail /aws/apigateway/notes-app-staging-api --follow
```

### 5. Test API Directly

**Get your Cognito token:**

```javascript
// In browser console (while logged in)
import { fetchAuthSession } from "aws-amplify/auth";
const session = await fetchAuthSession();
console.log("Token:", session.tokens.idToken.toString());
```

**Test with curl:**

```bash
# Replace with your actual values
API_URL="https://your-api-id.execute-api.us-east-2.amazonaws.com/prod"
TOKEN="your-cognito-jwt-token"

# Test GET /notes
curl -X GET "${API_URL}/notes" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"

# Test POST /notes
curl -X POST "${API_URL}/notes" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Note", "content": "This is a test"}'
```

### 6. Common Issues

#### Issue: Empty CloudWatch Logs

**Possible causes:**

- Lambda not being invoked (check API Gateway integration)
- Lambda function name mismatch
- API Gateway not configured correctly

**Fix:**

- Verify API Gateway routes are correctly configured
- Check Lambda function name matches what's in API Gateway
- Verify Lambda integration uses `proxy: true`

#### Issue: 401 Unauthorized

**Possible causes:**

- Missing or invalid JWT token
- Cognito authorizer not configured correctly
- Token expired

**Fix:**

- Check browser console for token errors
- Verify Cognito User Pool ID and Client ID in frontend config
- Try logging out and back in

#### Issue: 404 Not Found

**Possible causes:**

- Wrong API URL
- Lambda routing logic not matching path
- API Gateway resource not configured

**Fix:**

- Verify API URL includes `/prod` stage
- Check Lambda logs for routing information
- Verify API Gateway resources are created

#### Issue: 500 Internal Server Error

**Possible causes:**

- Lambda function error
- DynamoDB permissions issue
- Environment variable not set

**Fix:**

- Check CloudWatch logs for Lambda errors
- Verify Lambda has DynamoDB permissions
- Check Lambda environment variables

### 7. Enhanced Logging

The Lambda function now includes enhanced logging:

- Full event structure logged
- Routing decisions logged
- User email extraction logged
- All errors logged with context

Check CloudWatch logs for these messages to understand what's happening.

### 8. Verify Infrastructure

**Check all resources are deployed:**

```bash
cd infra
NOTES_APP_ENV=staging cdk list
NOTES_APP_ENV=staging cdk synth
```

**Verify resources exist:**

- DynamoDB table: `notes-app-staging-notes`
- Lambda function: `notes-app-staging-notes-api`
- API Gateway: `notes-app-staging-api`
- Cognito User Pool: `notes-app-staging-users`
