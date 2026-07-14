import type { WorkspaceRole } from "./workspace-membership.js";

export type WorkspacePermission =
  | "workspace.manage"
  | "members.manage"
  | "forms.create"
  | "forms.read"
  | "forms.update"
  | "forms.delete"
  | "forms.publish"
  | "submissions.read"
  | "submissions.export"
  | "analytics.read";

const rolePermissions: Readonly<Record<WorkspaceRole, readonly WorkspacePermission[]>> = {
  owner: [
    "workspace.manage",
    "members.manage",
    "forms.create",
    "forms.read",
    "forms.update",
    "forms.delete",
    "forms.publish",
    "submissions.read",
    "submissions.export",
    "analytics.read",
  ],
  admin: [
    "workspace.manage",
    "members.manage",
    "forms.create",
    "forms.read",
    "forms.update",
    "forms.delete",
    "forms.publish",
    "submissions.read",
    "submissions.export",
    "analytics.read",
  ],
  editor: [
    "forms.create",
    "forms.read",
    "forms.update",
    "forms.publish",
    "submissions.read",
    "submissions.export",
    "analytics.read",
  ],
  viewer: ["forms.read", "submissions.read", "analytics.read"],
};

export function roleHasPermission(
  role: WorkspaceRole,
  permission: WorkspacePermission,
): boolean {
  return rolePermissions[role].includes(permission);
}
