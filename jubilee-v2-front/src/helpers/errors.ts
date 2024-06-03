// Custom Error Types

export class MaxRetriesError extends Error {
  constructor(message: string) {
      super(message);
      this.name = "MaxRetriesError";
  }
}
