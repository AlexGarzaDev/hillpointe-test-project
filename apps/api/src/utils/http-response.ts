import { Response } from "express";
import { ApiErrorResponse } from "../types/http";

export function sendResponse<T>(res: Response, status: number, payload: T): Response<T> {
  return res.status(status).json(payload);
}

export function sendError(res: Response, status: number, error: string): Response<ApiErrorResponse> {
  return sendResponse(res, status, { success: false, error });
}