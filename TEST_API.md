# Testing the Notes API

## Quick Test Steps

### 1. Get Your Cognito Token

**In Browser Console (while logged in):**

```javascript
import { fetchAuthSession } from "aws-amplify/auth";
const session = await fetchAuthSession();
const token = session.tokens.idToken.toString();
console.log("Token:", token);
// Copy this token
```

### 2. Test with curl

```bash
# Set your token
TOKEN="your-cognito-jwt-token-here"
API_URL="https://b490kdwbci.execute-api.us-east-2.amazonaws.com/prod"

# Test GET /notes (should return empty array if no notes)
curl -X GET "${API_URL}/notes" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -v

# Test POST /notes (create a note)
curl -X POST "${API_URL}/notes" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Note", "content": "This is a test note", "tags": ["test"]}' \
  -v
```

### 3. Check CloudWatch Logs

```bash
# Watch Lambda logs in real-time
aws logs tail /aws/lambda/notes-app-staging-notes-api --follow

# Or check recent logs
aws logs tail /aws/lambda/notes-app-staging-notes-api --since 10m
```

### 4. Check Browser Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Try creating a note
4. Look for the request to `/notes`
5. Check:
   - Request URL
   - Request headers (Authorization header present?)
   - Response status
   - Response body

### 5. Common Issues to Check

**If you see 401 Unauthorized:**

- Token might be expired - try logging out and back in
- Check if Authorization header is being sent

**If you see 404 Not Found:**

- Check the API URL is correct
- Check Lambda routing logs

**If you see 500 Internal Server Error:**

- Check CloudWatch logs for Lambda errors
- Check if DynamoDB table exists
- Check Lambda environment variables

**If no request appears in Network tab:**

- Check browser console for errors
- Check if VITE_API_BASE_URL is set correctly
- Restart dev server after changing .env file
