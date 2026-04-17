class ApiError extends Error {
  status: number;
  code: string;
  
    constructor(status: number, message: string, code: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  
    static BadRequest(msg = "Bad request") {
      return new ApiError(400, msg, "BAD_REQUEST");
    }
  
    static Unauthorized(msg = "Unauthorized") {
      return new ApiError(401, msg, "UNAUTHORIZED");
    }
  
    static Forbidden(msg = "Forbidden") {
      return new ApiError(403, msg, "FORBIDDEN");
    }
  
    static NotFound(msg = "Not found") {
      return new ApiError(404, msg, "NOT_FOUND");
    }
  
    static Internal(msg = "Server error") {
      return new ApiError(500, msg, "SERVER_ERROR");
    }
  }
  
export default ApiError;
  
  