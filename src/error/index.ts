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
    public readonly timestamp: string;

    constructor(
        name: string,
        info: ErrInfo,
    ) {
        this.name = name;
        this.info = info;
        this.message = info.err && info.val
            ? typeof info.val === "string"
                ? info.val
                : info.val instanceof Error
                ? info.val.message
                : JSON.stringify(info.val)
            : "No additional error message provided";
        this.stack = info.err && info.stack
            ? info.stack
            : "Stack not available";
        this.timestamp = new Date().toISOString();
    }
}

class AuthError extends AppErrorBase<string> {
    readonly _tag = "AuthError";

    constructor(info: Err<string>) {
        super("AuthError", info);
    }
}

class ValidationError extends AppErrorBase<string> {
    readonly _tag = "ValidationError";

    constructor(info: Err<string>) {
        super("ValidationError", info);
    }
}

class DatabaseError extends AppErrorBase<string> {
    readonly _tag = "DatabaseError";

    constructor(info: Err<string>) {
        super("DatabaseError", info);
    }
}

class NotFoundError extends AppErrorBase<string> {
    readonly _tag = "NotFoundError";

    constructor(info: Err<string>) {
        super("NotFoundError", info);
    }
}

class NetworkError extends AppErrorBase<string> {
    readonly _tag = "NetworkError";

    constructor(info: Err<string>) {
        super("NetworkError", info);
    }
}

class TokenDecodeError extends AppErrorBase<string> {
    readonly _tag = "TokenDecodeError";

    constructor(info: Err<string>) {
        super("TokenDecodeError", info);
    }
}

class TimeoutError extends AppErrorBase<string> {
    readonly _tag = "TimeoutError";

    constructor(info: Err<string>) {
        super("TimeoutError", info);
    }
}

class PromiseRejectionError extends AppErrorBase<unknown> {
    readonly _tag = "PromiseRejectionError";

    constructor(info: Err<unknown>) {
        super("PromiseRejectionError", info);
    }
}

class RetryLimitExceededError extends AppErrorBase<string> {
    readonly _tag = "RetryLimitExceededError";

    constructor(info: Err<string>) {
        super("RetryLimitExceededError", info);
    }
}

class UnknownError extends AppErrorBase<unknown> {
    readonly _tag = "UnknownError";

    constructor(info: Err<unknown>) {
        super("UnknownError", info);
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
