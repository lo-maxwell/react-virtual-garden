'use client'

import { useEffect, useState } from "react";
import IconList from "./postgresTest";

const LoginPage = () => {

  const [testString, setTestString] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchTestString() {
      try {
        const response = await fetch('/api/test');
        const data: string = await response.json();
        setTestString(data);
      } catch (error) {
        console.error('Error fetching test string:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTestString();
  }, []);
  
  return (<>
      <div className={`flex flex-col mx-4 my-4`}>
      <div> {`This is the login page, but it's still in development...`}
      </div>
      <div>{loading ? `loading...` : testString}</div>
      <div>
        <IconList/>
      </div>
      </div>
    </>
  );
}

export default LoginPage;