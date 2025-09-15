// Central API error taxonomy for UI mapping and adapters.
export type ApiErrorCode =
  | "INPUT_INVALID"
  | "AUTH_UNAUTHORIZED"
  | "AUTH_FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT_POSITION"
  | "DUPLICATE_ITEM"
  | "RATE_LIMIT"
  | "UNKNOWN";

export type ApiError = {
  code: ApiErrorCode;
  message?: string;
};

export type ApiResponse<T> = { error?: ApiError } & T;

export function friendlyMessage(err: ApiError | undefined): string {
  if (!err) return "Something went wrong.";
  switch (err.code) {
    case "AUTH_UNAUTHORIZED":
      return "Please sign in to continue.";
    case "AUTH_FORBIDDEN":
      return "You don't have permission to do that.";
    case "INPUT_INVALID":
      return err.message || "Check your input and try again.";
    case "NOT_FOUND":
      return "Not found.";
    case "CONFLICT_POSITION":
      return "That spot changed. Your list was refreshed.";
    case "DUPLICATE_ITEM":
      return "That item is already on your list.";
    case "RATE_LIMIT":
      return "You're doing that too quickly. Please wait a moment.";
    default:
      return err.message || "Unexpected error.";
  }
}

