'use client'

import React from 'react';
import dynamic from 'next/dynamic';
import AuthComponent from './authComponent';

// Dynamically import the AuthComponent with ssr disabled
// const AuthComponent = dynamic(() => import('./AuthComponent'), {
//   ssr: false, // This disables server-side rendering for this component
// });

const LoginPage: React.FC = () => {

  
  return (<>
      <div className="flex flex-1 flex-col bg-reno-sand-200 text-black"> 
        <div className="mx-4">The login page isn&apos;t done yet! User login is disabled. Please enter with guest mode.</div>
        <AuthComponent />
      </div>
    </>
  );
}

export default LoginPage;