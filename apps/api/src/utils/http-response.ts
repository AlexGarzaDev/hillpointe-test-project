import { Response } from "express";
import { ApiErrorResponse } from "../types/http";

// Small response helpers keep endpoint handlers focused on domain behavior.
export function sendResponse<T>(res: Response, status: number, payload: T): Response<T> {
  return res.status(status).json(payload);
}

// Standard error shape used across all endpoints.
export function sendError(res: Response, status: number, error: string): Response<ApiErrorResponse> {
  return sendResponse(res, status, { success: false, error });
}