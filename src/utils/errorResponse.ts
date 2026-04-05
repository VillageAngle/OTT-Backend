export class ErrorResponse extends Error {
  constructor(
    public message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "ErrorResponse";
  }
}
