export class HttpError extends Error {
  code: number;

  constructor(message: string, code = 500) {
    super(message);
    this.name = 'HttpError';
    this.code = code;
  }
}
