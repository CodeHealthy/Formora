import { describe, expect, it } from "vitest";

import type { WorkspaceMembership } from "../../domain/workspace-membership.js";
import type { WorkspaceMembershipRepository } from "../../domain/workspace-membership.repository.js";
import { WorkspaceAuthorizationService } from "./workspace-authorization.service.js";

class StubMembershipRepository implements WorkspaceMembershipRepository {
  public constructor(private readonly membership: WorkspaceMembership | null) {}

  public findByWorkspaceAndUser(): Promise<WorkspaceMembership | null> {
    return Promise.resolve(this.membership);
  }
}

const viewerMembership: WorkspaceMembership = {
  id: "membership-id",
  workspaceId: "workspace-id",
  userId: "user-id",
  role: "viewer",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("WorkspaceAuthorizationService", () => {
  it("allows permissions assigned to the member role", async () => {
    const service = new WorkspaceAuthorizationService(
      new StubMembershipRepository(viewerMembership),
    );

    await expect(
      service.assertWorkspacePermission({
        userId: "user-id",
        workspaceId: "workspace-id",
        permission: "forms.read",
      }),
    ).resolves.toEqual(viewerMembership);
  });

  it("rejects permissions not assigned to the member role", async () => {
    const service = new WorkspaceAuthorizationService(
      new StubMembershipRepository(viewerMembership),
    );

    await expect(
      service.assertWorkspacePermission({
        userId: "user-id",
        workspaceId: "workspace-id",
        permission: "workspace.manage",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN", statusCode: 403 });
  });

  it("rejects users without workspace membership", async () => {
    const service = new WorkspaceAuthorizationService(new StubMembershipRepository(null));

    await expect(service.getMembership("user-id", "workspace-id")).rejects.toMatchObject({
      code: "FORBIDDEN",
      statusCode: 403,
    });
  });
});
