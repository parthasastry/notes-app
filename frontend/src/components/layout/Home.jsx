import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Home = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                            Your Personal
                            <span className="text-blue-600 block">Notes App</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                            A simple, clean way to capture and organize your thoughts.
                            Create, edit, and manage your notes all in one place.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            {isAuthenticated ? (
                                <button
                                    onClick={() => navigate('/notes')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-lg"
                                >
                                    Go to Notes
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-lg"
                                    >
                                        Get Started
                                    </button>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-lg border-2 border-blue-600"
                                    >
                                        Sign In
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Simple & Powerful
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Everything you need to capture and organize your thoughts.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                            <div className="text-4xl mb-4">✍️</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                Create Notes
                            </h3>
                            <p className="text-gray-600">
                                Quickly capture your thoughts with a clean, distraction-free interface.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                            <div className="text-4xl mb-4">📝</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                Organize Easily
                            </h3>
                            <p className="text-gray-600">
                                Keep all your notes in one place and find them instantly.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                            <div className="text-4xl mb-4">🔒</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                Secure & Private
                            </h3>
                            <p className="text-gray-600">
                                Your notes are encrypted and only accessible by you.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-blue-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ready to Start?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Sign up now and start organizing your thoughts today.
                    </p>
                    {!isAuthenticated && (
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-lg"
                        >
                            Get Started Today
                        </button>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Home;

