import {
	UnauthorizedError,
	ForbiddenError,
	BadRequestError,
	InternalServerError,
	UnknownError,
  } from "./errors";
  import { ApiError } from "./errors";
  
  export function mapFirebaseError(err: any): ApiError {
	if (!err || typeof err.code !== "string") {
	  return new UnknownError("Unknown Firebase error");
	}
  
	switch (err.code) {
	  case "auth/argument-error":
		return new BadRequestError("Invalid authentication argument");
  
	  case "auth/invalid-token":
	  case "auth/id-token-expired":
	  case "auth/user-disabled":
		return new UnauthorizedError("Invalid or expired authentication token");
  
	  case "auth/insufficient-permission":
		return new ForbiddenError("Insufficient permissions");
  
	  default:
		return new InternalServerError(err.message || "Firebase internal error");
	}
  }
  