export {};

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: {
        sessionId: string;
        userId: string;
      };
    }
  }
}
