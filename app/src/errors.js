class AppError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}
class ValidationError extends AppError { constructor(m) { super(m, 400); } }
class NotFoundError extends AppError { constructor(m) { super(m, 404); } }
class ConflictError extends AppError { constructor(m) { super(m, 409); } }

module.exports = { AppError, ValidationError, NotFoundError, ConflictError };
