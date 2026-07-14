import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

import { createQueryClient } from "../../shared/api/query-client";

const queryClient = createQueryClient();

export function ApplicationProviders({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
