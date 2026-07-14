import type { ZodType } from "zod";
import { apiErrorResponseSchema } from "./contracts";

import { webEnvironment } from "../config/environment";
import { ApiError } from "./api-error";

export interface ApiRequestOptions {
  body?: unknown;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
}

export async function requestValidated<T>(
  path: string,
  responseSchema: ZodType<T>,
  options: ApiRequestOptions = {},
): Promise<T> {
  const requestInit: RequestInit = {
    credentials: "include",
    headers: {
      accept: "application/json",
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
    },
    method: options.method ?? "GET",
  };

  if (options.body !== undefined) {
    requestInit.body = JSON.stringify(options.body);
  }

  const response = await fetch(
    `${webEnvironment.VITE_API_BASE_URL}${path}`,
    requestInit,
  );

  if (!response.ok) {
    const errorPayload: unknown = await response.json().catch(() => null);
    const parsedError = apiErrorResponseSchema.safeParse(errorPayload);

    throw parsedError.success
      ? new ApiError(
          parsedError.data.error.message,
          response.status,
          parsedError.data.error.code,
          parsedError.data.error.details,
        )
      : new ApiError("The API request failed.", response.status, "UNKNOWN_API_ERROR");
  }

  const payload: unknown = await response.json();
  return responseSchema.parse(payload);
}

export function getValidated<T>(path: string, responseSchema: ZodType<T>): Promise<T> {
  return requestValidated(path, responseSchema);
}
