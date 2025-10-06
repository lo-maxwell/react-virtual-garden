'use client'

import React from 'react';
import AuthComponent from './firebaseAuth/authComponent';

const LoginPage: React.FC = () => {

  
  return (<>
      <div className="flex flex-1 flex-col bg-reno-sand-200 text-black"> 
        <AuthComponent />
      </div>
    </>
  );
}

export default LoginPage;