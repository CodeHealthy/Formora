export const workspaceRoles = ["owner", "admin", "editor", "viewer"] as const;

export type WorkspaceRole = (typeof workspaceRoles)[number];

export interface WorkspaceMembership {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: Date;
  updatedAt: Date;
}
