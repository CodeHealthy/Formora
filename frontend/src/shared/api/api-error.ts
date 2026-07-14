export class ApiError extends Error {
  public constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details: unknown = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
