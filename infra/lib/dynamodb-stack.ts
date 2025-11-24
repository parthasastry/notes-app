import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface DynamoDBStackProps {
    environment: string;
}

export class DynamoDBStack extends Construct {
    public readonly usersTable: dynamodb.Table;
    public readonly notesTable: dynamodb.Table;

    constructor(scope: Construct, id: string, props: DynamoDBStackProps) {
        super(scope, id);

        // Users Table - Stores user authentication and profile info
        this.usersTable = new dynamodb.Table(this, 'UsersTable', {
            tableName: `notes-app-${props.environment}-users`,
            partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy: cdk.RemovalPolicy.RETAIN, // Protect user data
        });

        // Notes Table - Stores user notes
        // Partition key: user_email (to isolate notes by user)
        // Sort key: note_id (UUID for each note)
        this.notesTable = new dynamodb.Table(this, 'NotesTable', {
            tableName: `notes-app-${props.environment}-notes`,
            partitionKey: { name: 'user_email', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'note_id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            removalPolicy: cdk.RemovalPolicy.RETAIN, // Protect user data
        });

        // Outputs
        new cdk.CfnOutput(this, 'UsersTableName', {
            value: this.usersTable.tableName,
            description: 'Users Table Name',
            exportName: `NotesApp-${props.environment}-UsersTableName`,
        });

        new cdk.CfnOutput(this, 'UsersTableArn', {
            value: this.usersTable.tableArn,
            description: 'Users Table ARN',
            exportName: `NotesApp-${props.environment}-UsersTableArn`,
        });

        new cdk.CfnOutput(this, 'NotesTableName', {
            value: this.notesTable.tableName,
            description: 'Notes Table Name',
            exportName: `NotesApp-${props.environment}-NotesTableName`,
        });

        new cdk.CfnOutput(this, 'NotesTableArn', {
            value: this.notesTable.tableArn,
            description: 'Notes Table ARN',
            exportName: `NotesApp-${props.environment}-NotesTableArn`,
        });
    }
}

