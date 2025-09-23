import { auth } from "../firebase/firebaseConfig";
import { ApiErrorCodes } from "./error/apiErrorCodes";

export async function makeApiRequest(
	method: string,
	apiRoute: string,
	data: object = {},
	authRequired: boolean = true
  ): Promise<any> {
	try {
	  let idToken: string | null = null;
  
	  if (authRequired && auth?.currentUser) {
		idToken = await auth.currentUser.getIdToken();
	  }
  
	  const headers: HeadersInit = { "Content-Type": "application/json" };
	  if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
  
	  const options: RequestInit = { method, headers };
	  if (method !== "GET") options.body = JSON.stringify(data);
  
	  const response = await fetch(apiRoute, options);
	  const json = await response.json();
  
	  if (!response.ok) {
		// Use backend error if available
		const message = json?.error?.message || `HTTP error! status: ${response.status}`;
		const code = json?.error?.code || ApiErrorCodes.API_ERROR;
		throw { message, code }; // throw a structured object
	  }
	
	  return json; // success case
	} catch (err: any) {
	  console.error("API request error:", err);
	
	  // Normalize all errors to your ApiErrorCodes structure
	  return {
		success: false,
		error: {
		  code: err.code || ApiErrorCodes.API_ERROR,
		  message: err.message || "Unknown error occurred",
		},
	  };
	}
}