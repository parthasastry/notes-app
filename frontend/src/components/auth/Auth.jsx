import React, { useEffect } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { useAuth } from '../../contexts/AuthContext';

const AuthenticatedRedirect = () => {
    const navigate = useNavigate();
    const { setUser, setIsAuthenticated } = useAuth();

    useEffect(() => {
        const updateAuthContext = async () => {
            try {
                const userData = await getCurrentUser();
                const userAttributes = await fetchUserAttributes();

                const userInfo = {
                    ...userData,
                    email: userAttributes.email,
                    given_name: userAttributes.given_name,
                    family_name: userAttributes.family_name,
                    ...userAttributes
                };

                setUser(userInfo);
                setIsAuthenticated(true);
                navigate('/notes');
            } catch (error) {
                console.error('Error updating auth context:', error);
            }
        };

        updateAuthContext();
    }, [navigate, setUser, setIsAuthenticated]);

    return (
        <div className="flex justify-center items-center h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Redirecting...</p>
            </div>
        </div>
    );
};

const Auth = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
        return null;
    }

    return (
        <div className="flex flex-col justify-center items-center min-h-screen w-full p-5 bg-gray-50">
            <style>{`
                [data-amplify-authenticator] {
                    --amplify-colors-background-primary: transparent;
                    --amplify-colors-background-secondary: transparent;
                    box-shadow: none;
                    border: none;
                }
                
                [data-amplify-authenticator] [data-amplify-header] {
                    display: none;
                }
                
                [data-amplify-authenticator] [data-amplify-router] {
                    background: white;
                    border-radius: 0.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e5e7eb;
                    padding: 2rem;
                    max-width: 400px;
                    width: 100%;
                }
                
                [data-amplify-authenticator] input {
                    border-radius: 0.375rem;
                    border: 1px solid #d1d5db;
                    padding: 0.5rem 0.75rem;
                }
                
                [data-amplify-authenticator] button {
                    border-radius: 0.375rem;
                    font-weight: 500;
                }
                
                [data-amplify-authenticator] button[type="submit"] {
                    background-color: #2563eb;
                    color: white;
                    border: none;
                    padding: 0.75rem 1rem;
                }
                
                [data-amplify-authenticator] button[type="submit"]:hover {
                    background-color: #1d4ed8;
                }
            `}</style>
            <Authenticator hideSignUp={false}>
                {() => <AuthenticatedRedirect />}
            </Authenticator>
        </div>
    );
};

export default Auth;

