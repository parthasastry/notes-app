import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';

export interface LambdaStackProps {
    environment: string;
    usersTable: dynamodb.Table;
    notesTable: dynamodb.Table;
}

export class LambdaStack extends Construct {
    public readonly postConfirmationLambda: lambda.Function;
    public readonly notesApiLambda: lambda.Function;

    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id);

        // Post-Confirmation Lambda - Creates user record in DynamoDB after email verification
        this.postConfirmationLambda = new lambda.Function(this, 'PostConfirmationLambda', {
            functionName: `notes-app-${props.environment}-post-confirmation`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(
                path.join(__dirname, '../../backend/lambda/cognito-triggers/post-confirmation')
            ),
            environment: {
                TABLE_USERS: props.usersTable.tableName,
            },
            timeout: cdk.Duration.seconds(30),
            memorySize: 128,
        });

        // Notes API Lambda - Handles CRUD operations for notes
        this.notesApiLambda = new lambda.Function(this, 'NotesApiLambda', {
            functionName: `notes-app-${props.environment}-notes-api`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(
                path.join(__dirname, '../../backend/lambda/notes-api')
            ),
            environment: {
                TABLE_NOTES: props.notesTable.tableName,
            },
            timeout: cdk.Duration.seconds(30),
            memorySize: 256,
        });

        // Grant permissions
        props.usersTable.grantWriteData(this.postConfirmationLambda);
        props.notesTable.grantReadWriteData(this.notesApiLambda);

        // Outputs
        new cdk.CfnOutput(this, 'PostConfirmationLambdaArn', {
            value: this.postConfirmationLambda.functionArn,
            description: 'Post-Confirmation Lambda ARN',
            exportName: `NotesApp-${props.environment}-PostConfirmationLambdaArn`,
        });

        new cdk.CfnOutput(this, 'NotesApiLambdaArn', {
            value: this.notesApiLambda.functionArn,
            description: 'Notes API Lambda ARN',
            exportName: `NotesApp-${props.environment}-NotesApiLambdaArn`,
        });
    }
}

