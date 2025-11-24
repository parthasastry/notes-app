import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
import { useAuth } from '../../contexts/AuthContext';

const Navigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, setUser, setIsAuthenticated } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownRef = useRef(null);

    const handleSignOut = async () => {
        try {
            await signOut();
            setUser(null);
            setIsAuthenticated(false);
            setIsMobileMenuOpen(false);
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const navItems = [
        { name: 'Notes', path: '/notes', requiresAuth: true },
    ];

    const isActive = (path) => location.pathname === path;

    const handleDropdownToggle = () => {
        setActiveDropdown(activeDropdown === 'user' ? null : 'user');
    };

    // Handle clicks outside dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and Brand */}
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center space-x-3 group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center group-hover:scale-105 transition-all duration-200">
                                <span className="text-white text-xl font-bold">N</span>
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-lg font-bold text-gray-900">Notes App</div>
                                <div className="text-xs text-gray-500 -mt-1">Your personal notes</div>
                            </div>
                        </button>
                    </div>

                    {/* Desktop Navigation */}
                    {user && (
                        <div className="hidden lg:block">
                            <div className="flex items-center space-x-1">
                                {navItems.map((item) => (
                                    <button
                                        key={item.name}
                                        onClick={() => navigate(item.path)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(item.path)
                                                ? 'bg-blue-100 text-blue-700 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        {item.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* User Menu / Auth Buttons */}
                    <div className="flex items-center space-x-3">
                        {user ? (
                            <>
                                {/* User Profile Dropdown */}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={handleDropdownToggle}
                                        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">
                                                {user.given_name?.[0] || user.email?.[0]?.toUpperCase()}
                                                {user.family_name?.[0] || ''}
                                            </span>
                                        </div>
                                        <div className="hidden sm:block text-left">
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.given_name && user.family_name
                                                    ? `${user.given_name} ${user.family_name}`
                                                    : user.email}
                                            </div>
                                        </div>
                                        <svg
                                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${activeDropdown === 'user' ? 'rotate-180' : ''
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>

                                    {/* User Dropdown Menu */}
                                    {activeDropdown === 'user' && (
                                        <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                            {/* User Info Section */}
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-sm font-medium">
                                                            {user.given_name?.[0] || user.email?.[0]?.toUpperCase()}
                                                            {user.family_name?.[0] || ''}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.given_name && user.family_name
                                                                ? `${user.given_name} ${user.family_name}`
                                                                : user.email}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sign Out */}
                                            <div className="border-t border-gray-100 pt-1">
                                                <button
                                                    onClick={handleSignOut}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                                                >
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm"
                            >
                                Sign In
                            </button>
                        )}

                        {/* Mobile menu button */}
                        {user && (
                            <div className="lg:hidden">
                                <button
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
                                >
                                    <span className="sr-only">Open main menu</span>
                                    {isMobileMenuOpen ? (
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    ) : (
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 6h16M4 12h16M4 18h16"
                                            />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen && user && (
                <div className="lg:hidden">
                    <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 space-y-4">
                        {/* Main Navigation */}
                        <div className="space-y-2">
                            {navItems.map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => {
                                        navigate(item.path);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${isActive(item.path)
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>

                        {/* User Section */}
                        <div className="space-y-2 border-t border-gray-200 pt-4">
                            <div className="px-4 py-3 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-medium">
                                            {user.given_name?.[0] || user.email?.[0]?.toUpperCase()}
                                            {user.family_name?.[0] || ''}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-base font-medium text-gray-900">
                                            {user.given_name && user.family_name
                                                ? `${user.given_name} ${user.family_name}`
                                                : user.email}
                                        </div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSignOut}
                                className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navigation;

