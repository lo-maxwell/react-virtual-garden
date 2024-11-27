import { auth } from "../firebase/firebaseConfig";
  
export async function makeApiRequest(
	method: string,
	apiRoute: string,
	data: object = {},
	authRequired: boolean = true
  ): Promise<any> {
	if (authRequired && (!auth || !auth.currentUser)) {
	  throw new Error("Firebase auth is not initialized or no user is logged in.");
	}
  
	try {
	  let idToken: string | null = null;
	  
	  if (authRequired && auth && auth.currentUser) {
		// Fetch the current user's ID token if authentication is required
		idToken = await auth.currentUser.getIdToken();
	  }

	  if (authRequired && !idToken) {
		throw new Error("User is not authenticated or unable to retrieve ID token.");
	  }
  
	  // Create the request body and headers
	  let requestBody;
	  if (method !== 'GET') {
	   requestBody = JSON.stringify(data);
	  }
	  const headers: HeadersInit = {
		'Content-Type': 'application/json',
	  };
  
	  // Add Authorization header if needed
	  if (authRequired && idToken) {
		headers['Authorization'] = `Bearer ${idToken}`;
	  }
  
	  // Construct the full API endpoint URL
	  const url = `${apiRoute}`;
  
	  // Create options for the fetch request
	  const options: RequestInit = {
		method: method, // You can change this to 'POST', 'PUT', etc., based on the API action
		headers,
	  };

	   // Add body to options for methods other than GET
	   if (method !== 'GET' && requestBody) {
		options.body = requestBody;
	  	}
  
	  // Making the API request
	  const response = await fetch(url, options);
  
	  if (!response.ok) {
		throw new Error(`Failed to fetch ${url}`);
	  }
  
	  return await response.json(); // Assuming the response is JSON
	} catch (error) {
	  console.error("Error making API request:", error);
	  throw error;
	}
  }