export class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.status = status;
  }
}