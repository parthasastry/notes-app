#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { NotesAppStack } from '../lib/infra-stack';

// Load base .env file first (if it exists) to get NOTES_APP_ENV variable
// Use NOTES_APP_ENV instead of ENVIRONMENT to avoid conflicts with CDK
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Determine environment: command line > .env file > default to staging
// Check both NOTES_APP_ENV and ENVIRONMENT for backwards compatibility
const environment = process.env.NOTES_APP_ENV || 'staging';
const envFile = `.env.${environment}`;

// Load environment-specific .env file (overrides base .env values)
// This file contains environment-specific config (account, region, etc.)
// Use override: true to ensure environment-specific values override base .env values
dotenv.config({ path: path.join(__dirname, '..', envFile), override: true });

// Store environment value before CDK runs (CDK might read NOTES_APP_ENV from process.env)
const appEnvironment = environment;

// Remove NOTES_APP_ENV from process.env to avoid CDK confusion
// CDK should only use the env object we pass, not process.env variables
delete process.env.NOTES_APP_ENV;
delete process.env.ENVIRONMENT;

const app = new cdk.App();

// Use environment-specific stack names for clarity
// This ensures staging and production stacks are clearly separated
const stackName = appEnvironment === 'production'
  ? 'NotesAppStackProduction'
  : 'NotesAppStackStaging';

// Get account and region from environment variables
const account = process.env.CDK_DEFAULT_ACCOUNT?.trim();
const region = (process.env.CDK_DEFAULT_REGION || 'us-east-2').trim();

// Validate that account is set
if (!account) {
  console.error('❌ ERROR: CDK_DEFAULT_ACCOUNT not set in .env file!');
  console.error('   Please add CDK_DEFAULT_ACCOUNT=your-account-id to your .env file');
  process.exit(1);
}

console.log(`📦 Deploying stack: ${stackName}`);
console.log(`   Account: ${account}`);
console.log(`   Region: ${region}`);
console.log(`   App Environment: ${appEnvironment}`);

// Build stack props - pass environment via a custom prop
// Use a type assertion to add our custom prop
interface NotesAppStackProps extends cdk.StackProps {
  appEnvironment: string;
}

const stackProps: NotesAppStackProps = {
  env: {
    account: String(account),
    region: String(region),
  },
  appEnvironment: appEnvironment,
};

new NotesAppStack(app, stackName, stackProps);