import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DynamoDBStack } from './dynamodb-stack';
import { LambdaStack } from './lambda-stack';
import { CognitoStack } from './cognito-stack';
import { ApiGatewayStack } from './apigateway-stack';

export interface NotesAppStackProps extends cdk.StackProps {
  appEnvironment: string;
}

export class NotesAppStack extends cdk.Stack {
  public readonly appEnvironment: string; // Renamed from 'environment' to avoid CDK conflict

  // Main infrastructure stack for Notes App
  constructor(scope: Construct, id: string, props: NotesAppStackProps) {
    super(scope, id, props);

    // Get environment from props (passed from bin/infra.ts)
    this.appEnvironment = props.appEnvironment;

    // Output environment for reference
    new cdk.CfnOutput(this, 'Environment', {
      value: this.appEnvironment,
      description: 'Deployment environment (staging/production)',
    });

    // ===================================
    // 1. DynamoDB Tables
    // ===================================
    const database = new DynamoDBStack(this, 'Database', {
      environment: this.appEnvironment,
    });

    // ===================================
    // 2. Lambda Functions
    // ===================================
    const lambdas = new LambdaStack(this, 'Lambdas', {
      environment: this.appEnvironment,
      usersTable: database.usersTable,
      notesTable: database.notesTable,
    });

    // ===================================
    // 3. Cognito Authentication
    // ===================================
    const cognito = new CognitoStack(this, 'Cognito', {
      environment: this.appEnvironment,
      postConfirmationLambda: lambdas.postConfirmationLambda,
    });

    // ===================================
    // 4. API Gateway
    // ===================================
    const apiGateway = new ApiGatewayStack(this, 'ApiGateway', {
      environment: this.appEnvironment,
      notesApiLambda: lambdas.notesApiLambda,
      userPool: cognito.userPool,
    });

    // ===================================
    // Stack Outputs
    // ===================================
    new cdk.CfnOutput(this, 'StackName', {
      value: this.stackName,
      description: 'Stack Name',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
    });
  }
}
