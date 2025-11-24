#!/bin/bash
echo "=== Notes App API Setup Check ==="
echo ""

echo "1. Checking frontend .env file..."
if [ -f "frontend/.env" ]; then
    echo "   ✓ .env file exists"
    if grep -q "VITE_API_BASE_URL" frontend/.env; then
        API_URL=$(grep "VITE_API_BASE_URL" frontend/.env | cut -d '=' -f2)
        if [ -z "$API_URL" ]; then
            echo "   ✗ VITE_API_BASE_URL is empty!"
        else
            echo "   ✓ VITE_API_BASE_URL is set: $API_URL"
        fi
    else
        echo "   ✗ VITE_API_BASE_URL not found in .env"
    fi
else
    echo "   ✗ .env file not found in frontend/"
fi

echo ""
echo "2. Checking if API Gateway is deployed..."
STACK_NAME="NotesAppStackStaging"
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" &>/dev/null; then
    echo "   ✓ Stack $STACK_NAME exists"
    API_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`NotesAppStackStaging-ApiUrl`].OutputValue' --output text 2>/dev/null)
    if [ -n "$API_URL" ]; then
        echo "   ✓ API URL from CloudFormation: $API_URL"
    else
        echo "   ✗ API URL not found in CloudFormation outputs"
    fi
else
    echo "   ✗ Stack $STACK_NAME not found. Deploy first with: cd infra && NOTES_APP_ENV=staging cdk deploy"
fi

echo ""
echo "3. Checking Lambda function..."
LAMBDA_NAME=$(aws lambda list-functions --query 'Functions[?contains(FunctionName, `notes-app-staging-notes-api`)].FunctionName' --output text 2>/dev/null)
if [ -n "$LAMBDA_NAME" ]; then
    echo "   ✓ Lambda function exists: $LAMBDA_NAME"
else
    echo "   ✗ Lambda function not found"
fi

echo ""
echo "4. Checking DynamoDB table..."
TABLE_NAME=$(aws dynamodb list-tables --query 'TableNames[?contains(@, `notes-app-staging-notes`)]' --output text 2>/dev/null)
if [ -n "$TABLE_NAME" ]; then
    echo "   ✓ DynamoDB table exists: $TABLE_NAME"
    ITEM_COUNT=$(aws dynamodb scan --table-name "$TABLE_NAME" --select COUNT --query 'Count' --output text 2>/dev/null)
    echo "   ℹ Items in table: $ITEM_COUNT"
else
    echo "   ✗ DynamoDB table not found"
fi

echo ""
echo "=== Check Complete ==="
