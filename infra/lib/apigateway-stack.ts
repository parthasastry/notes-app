import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export interface ApiGatewayStackProps {
    environment: string;
    notesApiLambda: lambda.Function;
    userPool: cognito.UserPool;
}

export class ApiGatewayStack extends Construct {
    public readonly api: apigateway.RestApi;

    constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
        super(scope, id);

        // Create REST API
        this.api = new apigateway.RestApi(this, 'NotesApi', {
            restApiName: `notes-app-${props.environment}-api`,
            description: 'API for Notes App - CRUD operations for notes',
            deployOptions: {
                stageName: 'prod',
                throttlingRateLimit: 10,
                throttlingBurstLimit: 20,
            },
        });

        // Configure Gateway Responses to include CORS headers for error responses
        const corsHeadersForErrors = {
            'Access-Control-Allow-Origin': "'*'",
            'Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
            'Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
        };

        // Add CORS headers to timeout errors (504)
        this.api.addGatewayResponse('GatewayResponseTimeout', {
            type: apigateway.ResponseType.INTEGRATION_TIMEOUT,
            statusCode: '504',
            responseHeaders: corsHeadersForErrors,
            templates: {
                'application/json': JSON.stringify({
                    message: 'Gateway timeout. The Lambda function took too long to respond.',
                    error: 'INTEGRATION_TIMEOUT',
                }),
            },
        });

        // Add CORS headers to integration failure errors (502)
        this.api.addGatewayResponse('GatewayResponseIntegrationFailure', {
            type: apigateway.ResponseType.INTEGRATION_FAILURE,
            statusCode: '502',
            responseHeaders: corsHeadersForErrors,
            templates: {
                'application/json': JSON.stringify({
                    message: 'Integration failure',
                    error: 'INTEGRATION_FAILURE',
                }),
            },
        });

        // Add CORS headers to default 5XX errors
        this.api.addGatewayResponse('GatewayResponse5XX', {
            type: apigateway.ResponseType.DEFAULT_5XX,
            statusCode: '500',
            responseHeaders: corsHeadersForErrors,
        });

        // Add CORS headers to default 4XX errors
        this.api.addGatewayResponse('GatewayResponse4XX', {
            type: apigateway.ResponseType.DEFAULT_4XX,
            statusCode: '400',
            responseHeaders: corsHeadersForErrors,
        });

        // Create Cognito Authorizer
        const auth = new apigateway.CognitoUserPoolsAuthorizer(this, 'NotesAuthorizer', {
            cognitoUserPools: [props.userPool],
            identitySource: 'method.request.header.Authorization',
            authorizerName: `notes-app-${props.environment}-authorizer`,
        });

        // /notes resource
        const notesResource = this.api.root.addResource('notes');

        // Add CORS preflight for notes endpoint
        notesResource.addCorsPreflight({
            allowOrigins: [
                'http://localhost:5173',
                'http://localhost:3000',
                'https://localhost:5173',
                // Add production domain later
            ],
            allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowHeaders: [
                'Content-Type',
                'Authorization',
                'X-Amz-Date',
                'X-Api-Key',
                'X-Amz-Security-Token',
            ],
            allowCredentials: true,
        });

        // POST /notes - Create note
        notesResource.addMethod(
            'POST',
            new apigateway.LambdaIntegration(props.notesApiLambda, {
                proxy: true,
            }),
            {
                authorizer: auth,
                authorizationType: apigateway.AuthorizationType.COGNITO,
            }
        );

        // GET /notes - List all notes for user
        notesResource.addMethod(
            'GET',
            new apigateway.LambdaIntegration(props.notesApiLambda, {
                proxy: true,
            }),
            {
                authorizer: auth,
                authorizationType: apigateway.AuthorizationType.COGNITO,
            }
        );

        // /notes/{note_id} resource
        const noteResource = notesResource.addResource('{note_id}');

        // Add CORS preflight for note endpoint (with path parameter)
        noteResource.addCorsPreflight({
            allowOrigins: [
                'http://localhost:5173',
                'http://localhost:3000',
                'https://localhost:5173',
                // Add production domain later
            ],
            allowMethods: ['GET', 'PUT', 'DELETE', 'OPTIONS'],
            allowHeaders: [
                'Content-Type',
                'Authorization',
                'X-Amz-Date',
                'X-Api-Key',
                'X-Amz-Security-Token',
            ],
            allowCredentials: true,
        });

        // GET /notes/{note_id} - Get single note
        noteResource.addMethod(
            'GET',
            new apigateway.LambdaIntegration(props.notesApiLambda, {
                proxy: true,
            }),
            {
                authorizer: auth,
                authorizationType: apigateway.AuthorizationType.COGNITO,
            }
        );

        // PUT /notes/{note_id} - Update note
        noteResource.addMethod(
            'PUT',
            new apigateway.LambdaIntegration(props.notesApiLambda, {
                proxy: true,
            }),
            {
                authorizer: auth,
                authorizationType: apigateway.AuthorizationType.COGNITO,
            }
        );

        // DELETE /notes/{note_id} - Delete note
        noteResource.addMethod(
            'DELETE',
            new apigateway.LambdaIntegration(props.notesApiLambda, {
                proxy: true,
            }),
            {
                authorizer: auth,
                authorizationType: apigateway.AuthorizationType.COGNITO,
            }
        );

        // Outputs
        new cdk.CfnOutput(this, 'ApiUrl', {
            value: this.api.url,
            description: 'API Gateway URL',
            exportName: `NotesApp-${props.environment}-ApiUrl`,
        });

        new cdk.CfnOutput(this, 'NotesEndpoint', {
            value: `${this.api.url}notes`,
            description: 'Notes CRUD Endpoint',
            exportName: `NotesApp-${props.environment}-NotesEndpoint`,
        });
    }
}

