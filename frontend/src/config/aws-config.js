import { Amplify } from 'aws-amplify';

// Configure Amplify
const amplifyConfig = {
    Auth: {
        Cognito: {
            region: import.meta.env.VITE_AWS_REGION,
            userPoolId: import.meta.env.VITE_USER_POOL_ID,
            userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
        }
    },
}

export default amplifyConfig;