/**
 * Abstract base class for application-specific error handling.
 *
 * This class provides a standardized structure for custom error types throughout the application.
 * It captures essential error information including metadata, stack traces, and timestamps.
 *
 * @template E - The error type, typically a string or unknown type representing the specific error category
 * @template ErrInfo - Extended error information that implements ErrImpl<E>, containing additional context about the error
 *
 * @abstract
 * @class AppErrorBase
 *
 * @example
 * ```typescript
 * class ValidationError extends AppErrorBase<'VALIDATION_ERROR'> {
 *   readonly _tag = 'ValidationError';
 *
 *   constructor(message: string, info: ErrImpl<'VALIDATION_ERROR'>) {
 *     super('ValidationError', message, info);
 *   }
 * }
 * ```
 *
 * @property {string} _tag - Abstract property that must be implemented by concrete classes to identify the error type
 * @property {string} name - The name/type of the error (e.g., 'ValidationError', 'DatabaseError')
 * @property {string} message - Human-readable description of what went wrong
 * @property {ErrInfo} info - Additional error context and metadata specific to the error type
 * @property {string} stack - Stack trace information, falls back to "Stack not available" if unavailable
 * @property {Date} timestamp - When the error occurred, automatically set during construction
 */
abstract class AppErrorBase {
    abstract readonly _tag: string;
    public readonly name: string;
    public readonly message: string;

    constructor(name: string, message: string) {
        this.name = name;
        this.message = message;
    }
}

class AuthError extends AppErrorBase {
    readonly _tag = "AuthError";

    constructor(message = "Authentication error occurred") {
        super("AuthError", message);
    }
}

class ValidationError extends AppErrorBase {
    readonly _tag = "ValidationError";

    constructor(message = "Validation error occurred") {
        super("ValidationError", message);
    }
}

class DatabaseError extends AppErrorBase {
    readonly _tag = "DatabaseError";

    constructor(message = "Database error occurred") {
        super("DatabaseError", message);
    }
}

class NotFoundError extends AppErrorBase {
    readonly _tag = "NotFoundError";

    constructor(message = "Resource not found") {
        super("NotFoundError", message);
    }
}

class NetworkError extends AppErrorBase {
    readonly _tag = "NetworkError";

    constructor(message = "Network error occurred") {
        super("NetworkError", message);
    }
}

class TokenDecodeError extends AppErrorBase {
    readonly _tag = "TokenDecodeError";

    constructor(message = "Token decoding error occurred") {
        super("TokenDecodeError", message);
    }
}

class TimeoutError extends AppErrorBase {
    readonly _tag = "TimeoutError";

    constructor(message = "Operation timed out") {
        super("TimeoutError", message);
    }
}

class PromiseRejectionError extends AppErrorBase {
    readonly _tag = "PromiseRejectionError";

    constructor(message = "Unhandled promise rejection") {
        super("PromiseRejectionError", message);
    }
}

class RetryLimitExceededError extends AppErrorBase {
    readonly _tag = "RetryLimitExceededError";

    constructor(message = "Retry limit exceeded") {
        super("RetryLimitExceededError", message);
    }
}

class UnknownError extends AppErrorBase {
    readonly _tag = "UnknownError";

    constructor(message = "An unknown error occurred") {
        super("UnknownError", message);
    }
}

export {
    AppErrorBase,
    AuthError,
    DatabaseError,
    NetworkError,
    NotFoundError,
    PromiseRejectionError,
    RetryLimitExceededError,
    TimeoutError,
    TokenDecodeError,
    UnknownError,
    ValidationError,
};
