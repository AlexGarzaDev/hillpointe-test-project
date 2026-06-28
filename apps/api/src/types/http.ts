export type BodyParserError = Error & {
  type?: string;
  status?: number;
  statusCode?: number;
  received?: number;
  expected?: number;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
};
