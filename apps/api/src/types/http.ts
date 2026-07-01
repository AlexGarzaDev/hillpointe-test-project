// Body parser error shape includes optional metadata used by Express internals.
export type BodyParserError = Error & {
  type?: string;
  status?: number;
  statusCode?: number;
  received?: number;
  expected?: number;
};

// Shared API error response contract returned by sendError helper.
export type ApiErrorResponse = {
  success: false;
  error: string;
};
