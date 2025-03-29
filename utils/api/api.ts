import { auth } from "../firebase/firebaseConfig";
  
export async function makeApiRequest(
	method: string,
	apiRoute: string,
	data: object = {},
	authRequired: boolean = true
  ): Promise<any> {
	try {
	  let idToken: string | null = null;
	  
	  if (authRequired && auth?.currentUser) {
		// Only get the token if we have a user and auth is required
		idToken = await auth.currentUser.getIdToken();
	  }
  
	  // Create headers
	  const headers: HeadersInit = {
		'Content-Type': 'application/json',
	  };
  
	  if (idToken) {
		headers['Authorization'] = `Bearer ${idToken}`;
	  }
  
	  // Create options for the fetch request
	  const options: RequestInit = {
		method,
		headers,
	  };

	  // Add body for non-GET requests
	  if (method !== 'GET') {
		options.body = JSON.stringify(data);
	  }
  
	  const response = await fetch(apiRoute, options);
  
	  if (!response.ok) {
		throw new Error(`Failed to fetch ${apiRoute}`);
	  }
  
	  return await response.json();
	} catch (error) {
	  console.error("Error making API request:", error);
	  throw error;
	}
  }