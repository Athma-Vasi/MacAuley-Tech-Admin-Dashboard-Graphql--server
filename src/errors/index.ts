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
        error?: unknown,
        message = "Authentication error occurred",
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

    constructor(error?: unknown, message = "Validation error occurred") {
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
        error?: unknown,
        message = "Database error occurred",
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

    constructor(error?: unknown, message = "Resource not found") {
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

    constructor(error?: unknown, message = "Network error occurred") {
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

    constructor(error?: unknown, message = "Token decoding error occurred") {
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

class TokenVerificationError extends AppErrorBase {
    readonly _tag = "TokenVerificationError";

    constructor(
        error?: unknown,
        message = "Token verification error occurred",
    ) {
        super(
            "TokenVerificationError",
            error instanceof Error ? error.name : "UnknownError",
            error instanceof Error && error.stack
                ? error.stack
                : "Stack trace not available",
            message,
        );
    }
}

class TokenSignatureError extends AppErrorBase {
    readonly _tag = "TokenSignatureError";

    constructor(
        error?: unknown,
        message = "Token signature error occurred",
    ) {
        super(
            "TokenSignatureError",
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

    constructor(error?: unknown, message = "Operation timed out") {
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

    constructor(error?: unknown, message = "Retry limit exceeded") {
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

    constructor(error?: unknown, message = "Hash comparison error occurred") {
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

    constructor(error?: unknown, message = "Hash generation error occurred") {
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

    constructor(error?: unknown, message = "An unknown error occurred") {
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
    TokenSignatureError,
    TokenVerificationError,
    UnknownError,
    ValidationError,
};
