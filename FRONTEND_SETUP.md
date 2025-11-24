# Frontend Setup Guide

## What's Been Created

### Components

1. **AuthContext** (`src/contexts/AuthContext.jsx`)

   - Manages authentication state
   - Checks if user is logged in on app load
   - Provides user data throughout the app

2. **Auth Component** (`src/components/auth/Auth.jsx`)

   - Uses AWS Amplify UI `Authenticator` component
   - Handles sign up and sign in
   - Redirects to `/notes` after successful authentication

3. **Navigation Component** (`src/components/layout/Navigation.jsx`)

   - Navbar with "Notes" menu item
   - User profile dropdown with sign out
   - Mobile-responsive menu
   - Shows "Sign In" button when not authenticated

4. **Home/Landing Page** (`src/components/layout/Home.jsx`)

   - Hero section with call-to-action
   - Features section
   - CTA section
   - Redirects authenticated users to `/notes`

5. **Notes Component** (`src/components/notes/Notes.jsx`)

   - Placeholder component (ready for CRUD functionality)
   - Protected route (requires authentication)

6. **RequireAuth Component** (`src/components/auth/RequireAuth.jsx`)
   - Wrapper component that protects routes
   - Redirects to `/login` if not authenticated

### App Structure

- **App.jsx**: Main app component with routing
  - `/` - Landing page (or redirects to `/notes` if authenticated)
  - `/login` - Authentication page
  - `/notes` - Notes page (protected)

## Environment Variables

Create a `.env` file in the `frontend/` directory with:

```env
VITE_AWS_REGION=us-east-2
VITE_USER_POOL_ID=your-user-pool-id
VITE_USER_POOL_CLIENT_ID=your-user-pool-client-id
VITE_API_BASE_URL=https://your-api-id.execute-api.us-east-2.amazonaws.com/prod
```

### Getting the Values

After deploying your infrastructure, get the values from CDK outputs:

```bash
cd infra
NOTES_APP_ENV=staging cdk deploy

# Get outputs
aws cloudformation describe-stacks \
  --stack-name NotesAppStackStaging \
  --query 'Stacks[0].Outputs' \
  --output table
```

Look for:

- `NotesAppStackStaging-UserPoolId` → `VITE_USER_POOL_ID`
- `NotesAppStackStaging-UserPoolClientId` → `VITE_USER_POOL_CLIENT_ID`
- `NotesAppStackStaging-ApiUrl` → `VITE_API_BASE_URL` (should end with `/prod`)
- Region from your `.env.staging` file → `VITE_AWS_REGION`

Or check the AWS Console:

1. Go to CloudFormation → Stacks → `NotesAppStackStaging`
2. Click on "Outputs" tab
3. Copy the values

## Running the Frontend

```bash
cd frontend
npm install  # If not already done
npm run dev
```

The app will be available at `http://localhost:5173`

## Features

### ✅ Implemented

- AWS Amplify UI authentication (sign up/sign in)
- Protected routes
- Navigation with user menu
- Landing page
- Responsive design (mobile-friendly)
- Auth state management

### ✅ Implemented (CRUD)

- **List Notes** - View all your notes in a grid layout
- **Create Note** - Create new notes with title, content, and tags
- **Edit Note** - Update existing notes
- **Delete Note** - Remove notes with confirmation
- **Note Cards** - Beautiful card-based UI showing note preview
- **Tags Support** - Add and manage tags for notes
- **Loading States** - Proper loading indicators
- **Error Handling** - User-friendly error messages

## Components Created

### Notes Component (`components/notes/Notes.jsx`)

- Main notes page with list view
- Handles loading, error states
- Manages create/edit/delete operations

### NoteCard Component (`components/notes/NoteCard.jsx`)

- Displays individual note in card format
- Shows title, truncated content, tags, dates
- Edit and delete buttons

### NoteForm Component (`components/notes/NoteForm.jsx`)

- Modal form for creating/editing notes
- Title, content, and tags fields
- Form validation and error handling

### API Service (`services/api.js`)

- Axios-based API client
- Automatic JWT token injection
- Error handling and interceptors
- Methods: `getNotes()`, `getNote()`, `createNote()`, `updateNote()`, `deleteNote()`

## File Structure

```
frontend/
├── src/
│   ├── App.jsx                    # Main app with routing
│   ├── main.jsx                   # Entry point
│   ├── config/
│   │   └── aws-config.js         # Amplify configuration
│   ├── contexts/
│   │   └── AuthContext.jsx       # Authentication context
│   └── components/
│       ├── auth/
│       │   ├── Auth.jsx          # Login/signup component
│       │   └── RequireAuth.jsx  # Route protection
│       ├── layout/
│       │   ├── Navigation.jsx    # Navbar
│       │   └── Home.jsx         # Landing page
│       └── notes/
│           └── Notes.jsx        # Notes page (placeholder)
└── .env                          # Environment variables (create this)
```
