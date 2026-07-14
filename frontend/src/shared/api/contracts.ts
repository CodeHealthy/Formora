import { z } from "zod";

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.unknown().nullable(),
    requestId: z.string().min(1),
  }),
});

export const healthResponseSchema = z.object({
  data: z.object({ status: z.enum(["ok", "unavailable"]) }),
  meta: z.object({ requestId: z.string().min(1) }),
});

export const registerRequestSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  email: z.email().max(254),
  password: z.string().min(8).max(128),
});

export const loginRequestSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});

const authUserSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  email: z.email(),
  role: z.enum(["ADMIN", "USER", "GUEST"]),
  createdAt: z.iso.datetime(),
});

export const authSessionResponseSchema = z.object({
  data: z.object({ user: authUserSchema }),
  meta: z.object({ requestId: z.string().min(1) }),
});

export const logoutResponseSchema = z.object({
  data: z.object({ success: z.literal(true) }),
  meta: z.object({ requestId: z.string().min(1) }),
});

export const createWorkspaceRequestSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

const workspaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(["owner", "admin", "editor", "viewer"]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const workspaceResponseSchema = z.object({
  data: z.object({ workspace: workspaceSchema }),
  meta: z.object({ requestId: z.string().min(1) }),
});

export const workspaceListResponseSchema = z.object({
  data: z.object({ workspaces: z.array(workspaceSchema) }),
  meta: z.object({ requestId: z.string().min(1) }),
});

export const createFormRequestSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export const renameFormRequestSchema = createFormRequestSchema;

const formSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  ownerId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  status: z.enum(["draft", "published", "archived"]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  archivedAt: z.iso.datetime().nullable(),
});

export const formResponseSchema = z.object({
  data: z.object({ form: formSchema }),
  meta: z.object({ requestId: z.string().min(1) }),
});

export const formListResponseSchema = z.object({
  data: z.object({ forms: z.array(formSchema) }),
  meta: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    requestId: z.string().min(1),
  }),
});

export const formFieldTypeSchema = z.enum([
  "text",
  "textarea",
  "email",
  "number",
  "select",
  "checkbox",
]);

export const formFieldSchema = z.object({
  id: z.string().min(1).max(64),
  type: formFieldTypeSchema,
  label: z.string().min(1).max(120),
  required: z.boolean(),
  placeholder: z.string().max(200),
  options: z.array(z.string().min(1).max(120)).max(50),
});

export const formDefinitionSchema = z.object({
  schemaVersion: z.literal(1),
  fields: z.array(formFieldSchema).max(100),
});

export const formDraftResponseSchema = z.object({
  data: z.object({
    draft: formDefinitionSchema.extend({ updatedAt: z.iso.datetime() }),
  }),
  meta: z.object({ requestId: z.string().min(1) }),
});

export const formAccessModeSchema = z.enum(["LINK", "PASSWORD"]);

export const formAccessRequestSchema = z.discriminatedUnion("accessMode", [
  z.object({ accessMode: z.literal("LINK"), password: z.null().optional() }),
  z.object({ accessMode: z.literal("PASSWORD"), password: z.string().min(8).max(128) }),
]);

export const formAccessResponseSchema = z.object({
  data: z.object({
    accessSettings: z.object({
      accessMode: formAccessModeSchema,
      passwordConfigured: z.boolean(),
    }),
  }),
  meta: z.object({ requestId: z.string().min(1) }),
});

const publicFormSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  requiresPassword: z.boolean(),
  publicationVersion: z.number().int().positive(),
  definition: formDefinitionSchema.nullable(),
});

export const publicFormResponseSchema = z.object({
  data: z.object({ form: publicFormSchema }),
  meta: z.object({ requestId: z.string().min(1) }),
});

export const publicFormAccessResponseSchema = z.object({
  data: z.object({
    form: publicFormSchema.extend({ definition: formDefinitionSchema }),
    accessToken: z.string().min(1),
    expiresAt: z.iso.datetime(),
  }),
  meta: z.object({ requestId: z.string().min(1) }),
});

export const submissionResponseSchema = z.object({
  data: z.object({
    submissionId: z.string().min(1),
    submittedAt: z.iso.datetime(),
  }),
  meta: z.object({ requestId: z.string().min(1) }),
});

const managedSubmissionSummarySchema = z.object({
  id: z.string().min(1),
  publicationVersion: z.number().int().positive(),
  answeredFields: z.number().int().min(0),
  submittedAt: z.iso.datetime(),
});

export const managedSubmissionListResponseSchema = z.object({
  data: z.object({ submissions: z.array(managedSubmissionSummarySchema) }),
  meta: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    availableVersions: z.array(z.number().int().positive()),
    requestId: z.string().min(1),
  }),
});

const managedAnswerSchema = z.object({
  fieldId: z.string().min(1),
  label: z.string().min(1),
  type: formFieldTypeSchema,
  answered: z.boolean(),
  value: z.unknown(),
});

export const managedSubmissionResponseSchema = z.object({
  data: z.object({
    submission: z.object({
      id: z.string().min(1),
      formId: z.string().min(1),
      formTitle: z.string().min(1),
      publicationVersion: z.number().int().positive(),
      publicationTitle: z.string().min(1),
      submittedAt: z.iso.datetime(),
      answers: z.array(managedAnswerSchema),
    }),
  }),
  meta: z.object({ requestId: z.string().min(1) }),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
export type CreateWorkspaceRequest = z.infer<typeof createWorkspaceRequestSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type WorkspaceResponse = z.infer<typeof workspaceResponseSchema>;
export type WorkspaceListResponse = z.infer<typeof workspaceListResponseSchema>;
export type CreateFormRequest = z.infer<typeof createFormRequestSchema>;
export type RenameFormRequest = z.infer<typeof renameFormRequestSchema>;
export type FormListQuery = { page: number; pageSize: number; includeArchived: boolean };
export type FormResponse = z.infer<typeof formResponseSchema>;
export type FormListResponse = z.infer<typeof formListResponseSchema>;
export type FormFieldType = z.infer<typeof formFieldTypeSchema>;
export type FormField = z.infer<typeof formFieldSchema>;
export type FormDefinition = z.infer<typeof formDefinitionSchema>;
export type FormDraftResponse = z.infer<typeof formDraftResponseSchema>;
export type FormAccessMode = z.infer<typeof formAccessModeSchema>;
export type FormAccessRequest = z.infer<typeof formAccessRequestSchema>;
export type FormAccessResponse = z.infer<typeof formAccessResponseSchema>;
export type PublicForm = z.infer<typeof publicFormSchema>;
export type PublicFormResponse = z.infer<typeof publicFormResponseSchema>;
export type PublicFormAccessResponse = z.infer<typeof publicFormAccessResponseSchema>;
export type SubmissionResponse = z.infer<typeof submissionResponseSchema>;
export type SubmissionAnswers = Record<string, unknown>;
export type ManagedSubmissionListQuery = {
  page: number;
  pageSize: number;
  publicationVersion?: number;
  from?: string;
  to?: string;
};
export type ManagedSubmissionListResponse = z.infer<typeof managedSubmissionListResponseSchema>;
export type ManagedSubmissionResponse = z.infer<typeof managedSubmissionResponseSchema>;
