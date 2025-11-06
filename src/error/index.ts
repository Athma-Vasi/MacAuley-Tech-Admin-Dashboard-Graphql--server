import type { Err, ErrImpl } from "ts-results";

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
abstract class AppErrorBase<
    E extends string | unknown = string,
    ErrInfo extends ErrImpl<E> = ErrImpl<E>,
> {
    abstract readonly _tag: string;
    public readonly name: string;
    public readonly message: string;
    public readonly info: ErrInfo;
    public readonly stack: string;
    public readonly timestamp: Date;

    constructor(
        name: string,
        message: string,
        info: ErrInfo,
    ) {
        this.name = name;
        this.message = message;
        this.info = info;
        this.stack = info.err && info.stack
            ? info.stack
            : "Stack not available";
        this.timestamp = new Date();
    }
}

class AuthError extends AppErrorBase<string> {
    readonly _tag = "AuthError";

    constructor(
        info: Err<string>,
        message = "Authentication error occurred",
    ) {
        super("AuthError", message, info);
    }
}

class ValidationError extends AppErrorBase<string> {
    readonly _tag = "ValidationError";

    constructor(
        info: Err<string>,
        message = "Validation error occurred",
    ) {
        super("ValidationError", message, info);
    }
}

class DatabaseError extends AppErrorBase<string> {
    readonly _tag = "DatabaseError";

    constructor(
        info: Err<string>,
        message = "Database error occurred",
    ) {
        super("DatabaseError", message, info);
    }
}

class NotFoundError extends AppErrorBase<string> {
    readonly _tag = "NotFoundError";

    constructor(
        info: Err<string>,
        message = "Resource not found",
    ) {
        super("NotFoundError", message, info);
    }
}

class NetworkError extends AppErrorBase<string> {
    readonly _tag = "NetworkError";

    constructor(
        info: Err<string>,
        message = "Network error occurred",
    ) {
        super("NetworkError", message, info);
    }
}

class TokenDecodeError extends AppErrorBase<string> {
    readonly _tag = "TokenDecodeError";

    constructor(
        info: Err<string>,
        message = "Token decoding error occurred",
    ) {
        super("TokenDecodeError", message, info);
    }
}

class TimeoutError extends AppErrorBase<string> {
    readonly _tag = "TimeoutError";

    constructor(
        info: Err<string>,
        message = "Operation timed out",
    ) {
        super("TimeoutError", message, info);
    }
}

class PromiseRejectionError extends AppErrorBase<unknown> {
    readonly _tag = "PromiseRejectionError";

    constructor(
        info: Err<unknown>,
        message = "Unhandled promise rejection",
    ) {
        super("PromiseRejectionError", message, info);
    }
}

class UnknownError extends AppErrorBase<unknown> {
    readonly _tag = "UnknownError";

    constructor(
        info: Err<unknown>,
        message = "An unknown error occurred",
    ) {
        super("UnknownError", message, info);
    }
}

export {
    AppErrorBase,
    AuthError,
    DatabaseError,
    NetworkError,
    NotFoundError,
    PromiseRejectionError,
    TimeoutError,
    TokenDecodeError,
    UnknownError,
    ValidationError,
};
