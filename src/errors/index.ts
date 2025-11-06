abstract class AppErrorBase {
    abstract readonly _tag: string;
    public readonly name: string;
    public readonly message: string;
    public readonly errorKind: string;
    public readonly stack: string;

    constructor(
        name: string,
        errorKind: string,
        stack: string,
        message: string,
    ) {
        this.name = name;
        this.errorKind = errorKind;
        this.message = message;
        this.stack = stack;
    }
}

class AuthError extends AppErrorBase {
    readonly _tag = "AuthError";

    constructor(
        message = "Authentication error occurred",
        error?: unknown,
    ) {
        super(
            "AuthError",
            error instanceof Error ? error.name : "UnknownError",
            error instanceof Error && error.stack
                ? error.stack
                : "Stack trace not available",
            message,
        );
    }
}

class ValidationError extends AppErrorBase {
    readonly _tag = "ValidationError";

    constructor(message = "Validation error occurred", error?: unknown) {
        super(
            "ValidationError",
            error instanceof Error ? error.name : "UnknownError",
            error instanceof Error && error.stack
                ? error.stack
                : "Stack trace not available",
            message,
        );
    }
}

class DatabaseError extends AppErrorBase {
    readonly _tag = "DatabaseError";

    constructor(
        message = "Database error occurred",
        error?: unknown,
    ) {
        super(
            "DatabaseError",
            error instanceof Error ? error.name : "UnknownError",
            error instanceof Error && error.stack
                ? error.stack
                : "Stack trace not available",
            message,
        );
    }
}

class NotFoundError extends AppErrorBase {
    readonly _tag = "NotFoundError";

    constructor(message = "Resource not found", error?: unknown) {
        super(
            "NotFoundError",
            error instanceof Error ? error.name : "UnknownError",
            error instanceof Error && error.stack
                ? error.stack
                : "Stack trace not available",
            message,
        );
    }
}

class NetworkError extends AppErrorBase {
    readonly _tag = "NetworkError";

    constructor(message = "Network error occurred", error?: unknown) {
        super(
            "NetworkError",
            error instanceof Error ? error.name : "UnknownError",
            error instanceof Error && error.stack
                ? error.stack
                : "Stack trace not available",
            message,
        );
    }
}

class TokenDecodeError extends AppErrorBase {
    readonly _tag = "TokenDecodeError";

    constructor(message = "Token decoding error occurred", error?: unknown) {
        super(
            "TokenDecodeError",
            error instanceof Error ? error.name : "UnknownError",
            error instanceof Error && error.stack
                ? error.stack
                : "Stack trace not available",
            message,
        );
    }
}

class TimeoutError extends AppErrorBase {
    readonly _tag = "TimeoutError";

    constructor(message = "Operation timed out", error?: unknown) {
        super(
            "TimeoutError",
            error instanceof Error ? error.name : "UnknownError",
            error instanceof Error && error.stack
                ? error.stack
                : "Stack trace not available",
            message,
        );
    }
}

class PromiseRejectionError extends AppErrorBase {
    readonly _tag = "PromiseRejectionError";

    constructor(message = "Unhandled promise rejection", error?: unknown) {
        super(
            "PromiseRejectionError",
            error instanceof Error ? error.name : "UnknownError",
            error instanceof Error && error.stack
                ? error.stack
                : "Stack trace not available",
            message,
        );
    }
}

class RetryLimitExceededError extends AppErrorBase {
    readonly _tag = "RetryLimitExceededError";

    constructor(message = "Retry limit exceeded", error?: unknown) {
        super(
            "RetryLimitExceededError",
            error instanceof Error ? error.name : "UnknownError",
            error instanceof Error && error.stack
                ? error.stack
                : "Stack trace not available",
            message,
        );
    }
}

class HashComparisonError extends AppErrorBase {
    readonly _tag = "HashComparisonError";

    constructor(message = "Hash comparison error occurred", error?: unknown) {
        super(
            "HashComparisonError",
            error instanceof Error ? error.name : "UnknownError",
            error instanceof Error && error.stack
                ? error.stack
                : "Stack trace not available",
            message,
        );
    }
}

class HashGenerationError extends AppErrorBase {
    readonly _tag = "HashGenerationError";

    constructor(message = "Hash generation error occurred", error?: unknown) {
        super(
            "HashGenerationError",
            error instanceof Error ? error.name : "UnknownError",
            error instanceof Error && error.stack
                ? error.stack
                : "Stack trace not available",
            message,
        );
    }
}

class UnknownError extends AppErrorBase {
    readonly _tag = "UnknownError";

    constructor(message = "An unknown error occurred", error?: unknown) {
        super(
            "UnknownError",
            error instanceof Error ? error.name : "UnknownError",
            error instanceof Error && error.stack
                ? error.stack
                : "Stack trace not available",
            message,
        );
    }
}

export {
    AppErrorBase,
    AuthError,
    DatabaseError,
    HashComparisonError,
    HashGenerationError,
    NetworkError,
    NotFoundError,
    PromiseRejectionError,
    RetryLimitExceededError,
    TimeoutError,
    TokenDecodeError,
    UnknownError,
    ValidationError,
};
