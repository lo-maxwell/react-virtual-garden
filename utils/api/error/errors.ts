import { ApiErrorCodes } from "./apiErrorCodes";


export class ApiError extends Error {
  code: ApiErrorCodes;
  status: number;

  constructor(code: ApiErrorCodes, message: string, status: number) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
  }
}

export class NetworkError extends ApiError {
  constructor(message = "Network error") {
    super(ApiErrorCodes.NETWORK_ERROR, message, 503); // 503 Service Unavailable
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(ApiErrorCodes.UNAUTHORIZED, message, 401);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(ApiErrorCodes.FORBIDDEN, message, 403);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not found") {
    super(ApiErrorCodes.NOT_FOUND, message, 404);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad request") {
    super(ApiErrorCodes.BAD_REQUEST, message, 400);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = "Internal server error") {
    super(ApiErrorCodes.INTERNAL_SERVER_ERROR, message, 500);
  }
}

export class UnknownError extends ApiError {
  constructor(message = "Unknown error") {
    super(ApiErrorCodes.UNKNOWN_ERROR, message, 520); // 520 (Cloudflare style "Unknown Error")
  }
}

export class GenericApiError extends ApiError {
  constructor(message = "API error") {
    super(ApiErrorCodes.API_ERROR, message, 500);
  }
}
