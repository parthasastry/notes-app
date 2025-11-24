import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const usersTable = process.env.TABLE_USERS;

/**
 * Post-confirmation trigger for Cognito User Pool
 * Creates user record in DynamoDB after successful email verification
 * 
 * For Notes App - Simple user management
 */
export const handler = async (event) => {
    console.log('Post-confirmation trigger invoked:', JSON.stringify(event, null, 2));

    try {
        // Extract user attributes from Cognito event
        const userAttributes = event.request?.userAttributes || {};
        const cognitoSub = userAttributes.sub || event.userName;

        // Handle empty event case (testing or incomplete confirmation)
        if (!userAttributes || Object.keys(userAttributes).length === 0 || !cognitoSub) {
            console.warn('Empty or incomplete event received. Skipping user creation.');
            return event;
        }

        // Extract user data
        const email = userAttributes.email;
        const givenName = userAttributes.given_name || '';
        const familyName = userAttributes.family_name || '';
        const name = `${givenName} ${familyName}`.trim() || email.split('@')[0];

        // Validate required fields
        if (!email) {
            console.error('Missing required email attribute');
            throw new Error('Email is required');
        }

        console.log(`Creating user: ${email}`);

        // Create user record - using email as PK
        const userData = {
            email: email,                          // PK
            cognito_sub: cognitoSub,
            name: name,
            given_name: givenName,
            family_name: familyName,
            account_status: 'active',

            // Profile data
            profile: {
                notes_count: 0,
                last_note_date: null,
            },

            // Usage tracking
            last_login: new Date().toISOString(),

            // Metadata
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        // Create user in DynamoDB
        await docClient.send(new PutCommand({
            TableName: usersTable,
            Item: userData,
            ConditionExpression: 'attribute_not_exists(email)', // Prevent duplicates
        }));

        console.log(`Successfully created user ${email}`);

        // Return the event unchanged (required for Cognito triggers)
        return event;

    } catch (error) {
        console.error('Error in post-confirmation trigger:', error);

        // If user already exists, return event to not break Cognito flow
        if (error.name === 'ConditionalCheckFailedException') {
            console.log('User already exists, continuing...');
            return event;
        }

        // For other errors, log but don't break the Cognito flow
        // This ensures users can still log in even if DynamoDB write fails
        console.error('Non-critical error in post-confirmation trigger:', error.message);
        return event;
    }
};

