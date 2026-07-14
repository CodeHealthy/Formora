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

const workspaceId = "507f1f77bcf86cd799439012";
const formId = "507f1f77bcf86cd799439013";
const workspace = {
  id: workspaceId,
  name: "Acme Team",
  role: "owner",
  createdAt: "2026-07-14T12:00:00.000Z",
  updatedAt: "2026-07-14T12:00:00.000Z",
};

function formResponse(title: string, status: "draft" | "archived" = "draft") {
  return {
    data: {
      form: {
        id: formId,
        workspaceId,
        ownerId: "507f1f77bcf86cd799439011",
        title,
        slug: "customer-feedback",
        status,
        createdAt: "2026-07-14T12:00:00.000Z",
        updatedAt: "2026-07-14T12:00:00.000Z",
        archivedAt: status === "archived" ? "2026-07-14T12:05:00.000Z" : null,
      },
    },
    meta: { requestId: "req_test" },
  };
}

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

  it("navigates to the workspace chooser", async () => {
    const user = userEvent.setup();
    renderApplication("/");

    await user.click(await screen.findByRole("link", { name: "Forms" }));

    expect(
      screen.getByRole("heading", { name: "Choose a workspace" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No workspaces yet" })).toBeInTheDocument();
  });

  it("creates, renames, and archives a workspace form", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>((input, init) => {
        const url = getRequestUrl(input);

        if (url.endsWith("/auth/session")) {
          return Promise.resolve(jsonResponse(sessionResponse));
        }

        if (url.endsWith(`/workspaces/${workspaceId}`)) {
          return Promise.resolve(
            jsonResponse({ data: { workspace }, meta: { requestId: "req_test" } }),
          );
        }

        if (url.includes(`/workspaces/${workspaceId}/forms?`)) {
          return Promise.resolve(
            jsonResponse({
              data: { forms: [] },
              meta: {
                page: 1,
                pageSize: 12,
                totalItems: 0,
                totalPages: 0,
                requestId: "req_test",
              },
            }),
          );
        }

        if (url.endsWith(`/workspaces/${workspaceId}/forms`) && init?.method === "POST") {
          return Promise.resolve(jsonResponse(formResponse("Customer feedback"), 201));
        }

        if (url.endsWith(`/forms/${formId}`) && init?.method === "PATCH") {
          return Promise.resolve(jsonResponse(formResponse("Client feedback")));
        }

        if (url.endsWith(`/forms/${formId}`) && init?.method === "DELETE") {
          return Promise.resolve(jsonResponse(formResponse("Client feedback", "archived")));
        }

        return Promise.resolve(jsonResponse({}, 404));
      }),
    );

    renderApplication(`/workspaces/${workspaceId}/forms`);

    await user.type(await screen.findByLabelText("Form title"), "Customer feedback");
    await user.click(screen.getByRole("button", { name: "Create form" }));
    expect(
      await screen.findByRole("heading", { name: "Customer feedback" }),
    ).toBeInTheDocument();

    const renameInput = screen.getByLabelText("Form title");
    await user.clear(renameInput);
    await user.type(renameInput, "Client feedback");
    await user.click(screen.getByRole("button", { name: "Save title" }));
    expect(
      await screen.findByRole("heading", { name: "Client feedback" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Stable address: /customer-feedback")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Archive form" }));
    expect(await screen.findByRole("heading", { name: "Forms" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No forms found" })).toBeInTheDocument();
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
