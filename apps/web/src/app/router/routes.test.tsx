import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createQueryClient } from "../../shared/api/query-client";
import { applicationRoutes } from "./routes";

const sessionResponse = {
  data: {
    user: {
      id: "507f1f77bcf86cd799439011",
      displayName: "Ada Lovelace",
      email: "ada@example.com",
      createdAt: "2026-07-14T12:00:00.000Z",
    },
  },
  meta: { requestId: "req_test" },
};

const emptyWorkspaceResponse = {
  data: { workspaces: [] },
  meta: { requestId: "req_test" },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });
}

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  return input instanceof URL ? input.href : input.url;
}

function renderApplication(initialEntry: string) {
  const router = createMemoryRouter(applicationRoutes, {
    initialEntries: [initialEntry],
  });
  const queryClient = createQueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { queryClient, router };
}

describe("application routes", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>((input) => {
        const url = getRequestUrl(input);

        if (url.endsWith("/auth/session")) {
          return Promise.resolve(jsonResponse(sessionResponse));
        }

        if (url.endsWith("/workspaces")) {
          return Promise.resolve(jsonResponse(emptyWorkspaceResponse));
        }

        return Promise.resolve(jsonResponse({}, 404));
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the authenticated workspace overview and empty state", async () => {
    renderApplication("/");

    expect(
      await screen.findByRole("heading", { name: "Your workspaces" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "No workspaces yet" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("navigates to the forms empty state", async () => {
    const user = userEvent.setup();
    renderApplication("/");

    await user.click(await screen.findByRole("link", { name: "Forms" }));

    expect(screen.getByRole("heading", { name: "No forms yet" })).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          jsonResponse(
            {
              error: {
                code: "AUTHENTICATION_REQUIRED",
                message: "Authentication is required.",
                details: null,
                requestId: "req_test",
              },
            },
            401,
          ),
        ),
      ),
    );

    renderApplication("/");

    expect(
      await screen.findByRole("heading", { name: "Sign in to Formora" }),
    ).toBeInTheDocument();
  });

  it("validates login input before sending a request", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    renderApplication("/login");

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid email address")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates a workspace and opens its detail page", async () => {
    const user = userEvent.setup();
    const createdWorkspace = {
      data: {
        workspace: {
          id: "507f1f77bcf86cd799439012",
          name: "Acme Team",
          role: "owner",
          createdAt: "2026-07-14T12:00:00.000Z",
          updatedAt: "2026-07-14T12:00:00.000Z",
        },
      },
      meta: { requestId: "req_test" },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>((input, init) => {
        const url = getRequestUrl(input);

        if (url.endsWith("/auth/session")) {
          return Promise.resolve(jsonResponse(sessionResponse));
        }

        if (url.endsWith("/workspaces") && init?.method === "POST") {
          return Promise.resolve(jsonResponse(createdWorkspace, 201));
        }

        if (url.endsWith("/workspaces")) {
          return Promise.resolve(jsonResponse(emptyWorkspaceResponse));
        }

        return Promise.resolve(jsonResponse({}, 404));
      }),
    );
    renderApplication("/");

    await user.type(await screen.findByLabelText("Workspace name"), "Acme Team");
    await user.click(screen.getByRole("button", { name: "Create workspace" }));

    expect(
      await screen.findByRole("heading", { name: "Acme Team" }),
    ).toBeInTheDocument();
  });

  it("renders the route error page for an unknown path", async () => {
    renderApplication("/unknown");

    expect(
      await screen.findByRole("heading", { name: "This page does not exist" }),
    ).toBeInTheDocument();
  });
});
