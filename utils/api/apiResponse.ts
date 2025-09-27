import { NextResponse } from "next/server";
import { ApiError } from "./error/errors";

export class ApiResponse {
  static success<T>(data: T, status = 200) {
    return NextResponse.json({ success: true, data }, { status });
  }

  static error(code: string, message: string, status = 500) {
    return NextResponse.json(
      {
        success: false,
        error: { code, message },
      },
      { status }
    );
  }

  static fromError(error: unknown) {
    if (error instanceof ApiError) {
      return this.error(error.code, error.message, error.status);
    }

    // fallback — unknown/unexpected errors
    return this.error(
      "UNKNOWN_ERROR",
      (error as Error).message ?? "An unknown error occurred",
      500
    );
  }
}
