# How Lambda Knows Which DynamoDB Table to Use

## The Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. DynamoDB Stack Creates Table                                 │
│    ┌─────────────────────────────────────────────┐             │
│    │ tableName: "notes-app-staging-notes"        │             │
│    │ this.notesTable (CDK Table object)          │             │
│    └─────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Passed as prop
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Main Stack Wires Everything Together                         │
│    ┌─────────────────────────────────────────────┐             │
│    │ database.notesTable → lambdas.notesTable    │             │
│    └─────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Passed as prop
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Lambda Stack Sets Environment Variable                       │
│    ┌─────────────────────────────────────────────┐             │
│    │ environment: {                              │             │
│    │   TABLE_NOTES: props.notesTable.tableName   │             │
│    │ }                                           │             │
│    │                                             │             │
│    │ This becomes:                               │             │
│    │ TABLE_NOTES="notes-app-staging-notes"      │             │
│    └─────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Injected at Lambda creation
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Lambda Function Reads Environment Variable                  │
│    ┌─────────────────────────────────────────────┐             │
│    │ const notesTable = process.env.TABLE_NOTES; │             │
│    │ // Value: "notes-app-staging-notes"         │             │
│    └─────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Code Flow

### Step 1: DynamoDB Stack (`dynamodb-stack.ts`)

```typescript
export class DynamoDBStack extends Construct {
  public readonly notesTable: dynamodb.Table; // ← Exposed as public property

  constructor(scope: Construct, id: string, props: DynamoDBStackProps) {
    // Creates table with environment-specific name
    this.notesTable = new dynamodb.Table(this, "NotesTable", {
      tableName: `notes-app-${props.environment}-notes`, // ← Actual table name
      // ...
    });
  }
}
```

### Step 2: Main Stack (`infra-stack.ts`)

```typescript
// Create DynamoDB stack
const database = new DynamoDBStack(this, "Database", {
  environment: this.appEnvironment, // e.g., "staging"
});

// Pass table object to Lambda stack
const lambdas = new LambdaStack(this, "Lambdas", {
  environment: this.appEnvironment,
  notesTable: database.notesTable, // ← Table object passed here
});
```

### Step 3: Lambda Stack (`lambda-stack.ts`)

```typescript
export class LambdaStack extends Construct {
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    // Create Lambda function
    this.notesApiLambda = new lambda.Function(this, "NotesApiLambda", {
      // ...
      environment: {
        // Extract table name from the Table object
        TABLE_NOTES: props.notesTable.tableName, // ← Key step!
      },
    });

    // Also grant IAM permissions
    props.notesTable.grantReadWriteData(this.notesApiLambda);
  }
}
```

### Step 4: Lambda Function (`index.mjs`)

```javascript
// Read environment variable set by CDK
const notesTable = process.env.TABLE_NOTES;

// Use it in DynamoDB operations
await docClient.send(
  new PutCommand({
    TableName: notesTable, // ← Uses the environment variable
    Item: note,
  })
);
```

## Why This Approach?

1. **Environment-Aware**: Table name includes environment (`staging` vs `production`)
2. **Type-Safe**: CDK ensures the table exists before Lambda is created
3. **Automatic**: No hardcoding - table name is determined at deployment time
4. **Secure**: IAM permissions are automatically granted via `grantReadWriteData()`

## What Happens at Deployment Time?

When you run `cdk deploy`:

1. **CDK synthesizes CloudFormation**:

   - Creates DynamoDB table: `notes-app-staging-notes`
   - Creates Lambda function with environment variable: `TABLE_NOTES=notes-app-staging-notes`
   - Grants Lambda IAM permissions to access the table

2. **AWS creates resources**:

   - DynamoDB table is created with the exact name
   - Lambda function is created with the environment variable set
   - IAM role is attached to Lambda with DynamoDB permissions

3. **Lambda runs**:
   - Reads `process.env.TABLE_NOTES`
   - Gets value: `"notes-app-staging-notes"`
   - Uses it in all DynamoDB operations

## Verification

You can verify this works by:

1. **Check Lambda environment variables** (AWS Console):

   ```
   Lambda → notes-app-staging-notes-api → Configuration → Environment variables
   TABLE_NOTES = notes-app-staging-notes
   ```

2. **Check CloudFormation template**:

   ```bash
   cdk synth
   # Look for Lambda function definition with environment variables
   ```

3. **Test Lambda function**:
   - Lambda logs will show the table name being used
   - Check CloudWatch Logs for the Lambda function

## Key Points

- ✅ **No hardcoding**: Table name is determined by environment
- ✅ **Type-safe**: CDK ensures table exists before Lambda is created
- ✅ **Automatic permissions**: `grantReadWriteData()` handles IAM
- ✅ **Environment-specific**: Staging and production use different tables
- ✅ **Runtime resolution**: Lambda reads table name from environment variable at runtime
