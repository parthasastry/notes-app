import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export interface CognitoStackProps {
    environment: string;
    postConfirmationLambda?: lambda.Function;
}

export class CognitoStack extends Construct {
    public readonly userPool: cognito.UserPool;
    public readonly userPoolClient: cognito.UserPoolClient;

    constructor(scope: Construct, id: string, props: CognitoStackProps) {
        super(scope, id);

        // User Pool - Simplified for notes app
        this.userPool = new cognito.UserPool(this, 'NotesAppUserPool', {
            userPoolName: `notes-app-${props.environment}-users`,
            selfSignUpEnabled: true,
            signInAliases: {
                email: true,
            },
            autoVerify: {
                email: true,
            },
            standardAttributes: {
                email: {
                    required: true,
                    mutable: true,
                },
                givenName: {
                    required: false,
                    mutable: true,
                },
                familyName: {
                    required: false,
                    mutable: true,
                },
            },
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: false,
            },
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
            mfa: cognito.Mfa.OFF,
            // Add post-confirmation trigger if provided
            lambdaTriggers: props?.postConfirmationLambda ? {
                postConfirmation: props.postConfirmationLambda,
            } : undefined,
            removalPolicy: cdk.RemovalPolicy.RETAIN, // Protect user data
        });

        // User Pool Client
        this.userPoolClient = new cognito.UserPoolClient(this, 'NotesAppUserPoolClient', {
            userPool: this.userPool,
            userPoolClientName: `notes-app-${props.environment}-web-client`,
            generateSecret: false, // For web/mobile apps, no client secret needed
            authFlows: {
                userPassword: true,
                userSrp: true,
                adminUserPassword: true,
            },
            refreshTokenValidity: cdk.Duration.days(30),
            accessTokenValidity: cdk.Duration.hours(1),
            idTokenValidity: cdk.Duration.hours(1),
        });

        // Outputs
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: this.userPool.userPoolId,
            description: 'User Pool ID',
            exportName: `NotesApp-${props.environment}-UserPoolId`,
        });

        new cdk.CfnOutput(this, 'UserPoolClientId', {
            value: this.userPoolClient.userPoolClientId,
            description: 'User Pool Client ID',
            exportName: `NotesApp-${props.environment}-UserPoolClientId`,
        });
    }
}

