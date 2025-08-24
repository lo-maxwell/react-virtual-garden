// AuthComponent.tsx
import { useAuth } from '@/app/hooks/contexts/AuthContext';
import React, { useContext, useEffect, useState } from 'react';
import AuthCreateAccountComponent from './authCreateAccountComponent';
import AuthLoginComponent from './authLoginComponent';
import AuthLogoutComponent from './authLogoutComponent';
 // Import the AuthContext

const AuthComponent: React.FC = () => {
    const { firebaseUser, loading, logout } = useAuth(); // Access user and loading state
    const [displayLogin, setDisplayLogin] = useState<boolean>(true);
    const [message, setMessage] = useState<string>('');
    // const allowFirebase = process.env.NEXT_PUBLIC_TEST_ENV_KEY;

    const toggleDisplayLogin = (newValue: boolean | null = null) => {
        if (typeof newValue == "boolean" && displayLogin !== newValue) {
            setDisplayLogin(newValue);
        } else {
            setDisplayLogin(displayLogin => !displayLogin);
        }
    }

    if (loading) {
        return <p>Loading...</p>; // Show a loading message while checking auth state
    }

    return (
        <div className="flex items-center justify-center py-8">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold mb-4 text-center">Sign in to Virtual Garden</h2>
                {firebaseUser ? (
                    <AuthLogoutComponent message={message} setMessage={setMessage}></AuthLogoutComponent>
                ) : (
                    <>
                    <div className="flex justify-center space-x-4 mb-2"> {/* Added mb-2 for vertical gap */}
                        <button 
                            onClick={() => toggleDisplayLogin(true)} 
                            disabled={displayLogin}
                            className={`w-32 px-4 py-2 rounded border border-gray-400 ${displayLogin ? 'bg-green-500 text-white cursor-default opacity-75' : 'bg-white hover:bg-gray-50'}`} // Tailwind classes for styling
                        >
                            Login
                        </button>
                        <button 
                            onClick={() => toggleDisplayLogin(false)} 
                            disabled={!displayLogin}
                            className={`w-32 px-4 py-2 rounded border border-gray-400 ${!displayLogin ? 'bg-blue-500 text-white cursor-default opacity-75' : 'bg-white hover:bg-gray-50'}`} // Tailwind classes for styling
                        >
                            Register
                        </button>
                    </div>
                    {displayLogin ? (
                        <AuthLoginComponent message={message} setMessage={setMessage}></AuthLoginComponent>
                    ) : (
                        <AuthCreateAccountComponent message={message} setMessage={setMessage}></AuthCreateAccountComponent>
                    )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthComponent;