# Notes CRUD API Setup

## Overview

The Notes App now has a complete CRUD (Create, Read, Update, Delete) API for managing notes. All endpoints require Cognito authentication, ensuring users can only access their own notes.

## Architecture

### Components

1. **DynamoDB Notes Table** (`notes-app-{env}-notes`)

   - Partition Key: `user_email` (isolates notes by user)
   - Sort Key: `note_id` (UUID for each note)
   - Enables efficient querying of all notes for a user

2. **Lambda Function** (`notes-app-{env}-notes-api`)

   - Single Lambda handling all CRUD operations
   - Routes based on HTTP method and path
   - Extracts user email from Cognito authorizer context

3. **API Gateway REST API** (`notes-app-{env}-api`)
   - Cognito User Pool authorizer for authentication
   - CORS configured for frontend access
   - Error responses include CORS headers

## API Endpoints

All endpoints require authentication via Cognito JWT token in the `Authorization` header.

### Base URL

```
https://{api-id}.execute-api.{region}.amazonaws.com/prod
```

### Endpoints

#### 1. Create Note

**POST** `/notes`

**Request Body:**

```json
{
  "title": "My Note Title",
  "content": "Note content here...",
  "tags": ["tag1", "tag2"]
}
```

**Response (201):**

```json
{
  "message": "Note created successfully",
  "note": {
    "note_id": "uuid-here",
    "title": "My Note Title",
    "content": "Note content here...",
    "tags": ["tag1", "tag2"],
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2. List All Notes

**GET** `/notes`

**Response (200):**

```json
{
  "notes": [
    {
      "note_id": "uuid-1",
      "title": "Note 1",
      "content": "Content 1",
      "tags": [],
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### 3. Get Single Note

**GET** `/notes/{note_id}`

**Response (200):**

```json
{
  "note": {
    "note_id": "uuid-here",
    "title": "My Note Title",
    "content": "Note content here...",
    "tags": ["tag1"],
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 4. Update Note

**PUT** `/notes/{note_id}`

**Request Body:**

```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "tags": ["new-tag"]
}
```

_All fields are optional - only include fields you want to update_

**Response (200):**

```json
{
  "message": "Note updated successfully",
  "note": {
    "note_id": "uuid-here",
    "title": "Updated Title",
    "content": "Updated content",
    "tags": ["new-tag"],
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T01:00:00.000Z"
  }
}
```

#### 5. Delete Note

**DELETE** `/notes/{note_id}`

**Response (200):**

```json
{
  "message": "Note deleted successfully"
}
```

## Authentication

All endpoints require a Cognito JWT token in the Authorization header:

```
Authorization: Bearer {cognito-jwt-token}
```

The Lambda function extracts the user's email from the Cognito authorizer context, ensuring users can only access their own notes.

## Error Responses

All errors include CORS headers and follow this format:

```json
{
  "error": "Error message",
  "message": "Detailed error message (if available)"
}
```

**Common Status Codes:**

- `400` - Bad Request (missing required fields)
- `404` - Not Found (note doesn't exist or doesn't belong to user)
- `500` - Internal Server Error

## Security

1. **User Isolation**: Notes are partitioned by `user_email`, ensuring users can only access their own notes
2. **Cognito Authentication**: All endpoints require valid Cognito JWT tokens
3. **IAM Permissions**: Lambda has read/write access only to the notes table
4. **Conditional Updates/Deletes**: Operations include `ConditionExpression` to ensure notes exist before modification

## Deployment

### 1. Install Lambda Dependencies

```bash
cd backend/lambda/notes-api
npm install
```

### 2. Build Infrastructure

```bash
cd ../../../infra
npm run build
```

### 3. Deploy Staging

```bash
NOTES_APP_ENV=staging cdk deploy
```

### 4. Deploy Production

```bash
NOTES_APP_ENV=production cdk deploy
```

## Testing

After deployment, you'll get the API URL from CDK outputs:

```bash
cdk outputs
```

Look for:

- `NotesAppStackStaging-ApiUrl` (or `NotesAppStackProduction-ApiUrl`)
- `NotesAppStackStaging-NotesEndpoint`

### Example cURL Commands

```bash
# Get API URL from outputs
API_URL=$(aws cloudformation describe-stacks \
  --stack-name NotesAppStackStaging \
  --query 'Stacks[0].Outputs[?OutputKey==`NotesAppStackStaging-ApiUrl`].OutputValue' \
  --output text)

# Create a note (requires Cognito token)
curl -X POST "${API_URL}notes" \
  -H "Authorization: Bearer ${COGNITO_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Note", "content": "This is a test"}'

# List all notes
curl -X GET "${API_URL}notes" \
  -H "Authorization: Bearer ${COGNITO_TOKEN}"

# Get single note
curl -X GET "${API_URL}notes/{note_id}" \
  -H "Authorization: Bearer ${COGNITO_TOKEN}"

# Update note
curl -X PUT "${API_URL}notes/{note_id}" \
  -H "Authorization: Bearer ${COGNITO_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'

# Delete note
curl -X DELETE "${API_URL}notes/{note_id}" \
  -H "Authorization: Bearer ${COGNITO_TOKEN}"
```

## Next Steps

1. **Frontend Integration**: Connect your React frontend to these endpoints
2. **Pagination**: Add pagination for listing notes (currently returns all notes)
3. **Search/Filter**: Add search and filtering capabilities
4. **Rich Text**: Support for rich text formatting in notes
5. **Attachments**: Add support for file attachments
