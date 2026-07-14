import {
  healthResponseSchema,
  type HealthResponse,
} from "@formora/contracts";

import { getValidated } from "./api-client";

export function getApiHealth(): Promise<HealthResponse> {
  return getValidated("/health/live", healthResponseSchema);
}
