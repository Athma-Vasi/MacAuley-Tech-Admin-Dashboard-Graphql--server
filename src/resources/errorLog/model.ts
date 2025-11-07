import { model, Schema, type Types, type ValidatorProps } from "mongoose";
import { ERROR_LOG_EXPIRY } from "../../constants.ts";
import { FULL_NAME_REGEX, USERNAME_REGEX } from "../../regex/index.ts";

type ErrorLogSchema = {
    headers?: string;
    ip?: string;
    userAgent?: string;
    original?: string;
    expireAt?: Date;
    userId: string;
    username: string;
    sessionId: string;
    message: string;
    name: string;
    stack?: string;
    timestamp: string;
};

type ErrorLogDocument = ErrorLogSchema & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    __v: number;
};

const errorLogSchema = new Schema(
    {
        headers: {
            type: String,
            required: false,
        },
        ip: {
            type: String,
            required: false,
        },
        userAgent: {
            type: String,
            required: false,
        },
        original: {
            type: String,
            required: [false, "Original error is required. Received {VALUE}"],
        },
        expireAt: {
            type: Date,
            required: false,
            default: () => new Date(ERROR_LOG_EXPIRY), // 7 days
        },
        userId: {
            type: String,
            required: [true, "User ID is required. Received {VALUE}"],
            ref: "User",
            index: true,
        },
        username: {
            type: String,
            required: [true, "Username is required. Received {VALUE}"],
            validate: {
                validator: function usernameValidator(v: string) {
                    return USERNAME_REGEX.test(v);
                },
                message: (props: ValidatorProps) =>
                    `${props.value} is not a valid username. 
                     Usernames must be 3-48 characters long, can contain alphanumeric characters,
                     hyphens, underscores, and periods, cannot start with a hyphen, underscore, 
                     or period, and cannot consist entirely of zeroes.`,
            },
        },
        sessionId: {
            type: String,
            required: [true, "Session ID is required. Received {VALUE}"],
            index: true,
        },
        message: {
            type: String,
            required: [true, "Message is required. Received {VALUE}"],
            validate: {
                validator: function messageValidator(v: string) {
                    return v.trim().length > 0;
                },
                message: (_props: ValidatorProps) =>
                    `Error message cannot be empty or just whitespace.`,
            },
        },
        name: {
            type: String,
            required: [true, "Name is required. Received {VALUE}"],
            validate: {
                validator: function firstNameValidator(v: string) {
                    return FULL_NAME_REGEX.test(v);
                },
                message: (props: ValidatorProps) =>
                    `${props.value} is not a valid first name.
                     First names can only contain letters, spaces, periods, hyphens, and apostrophes.`,
            },
        },
        stack: {
            type: String,
            required: false,
            default: "No stack trace available.",
        },
        timestamp: {
            type: String,
            required: false,
            default: new Date().toISOString(),
        },
    },
    { timestamps: true },
);

errorLogSchema.index({
    headers: "text",
    ip: "text",
    message: "text",
    sessionId: "text",
    stack: "text",
    userAgent: "text",
    username: "text",
});

const ErrorLogModel = model<ErrorLogDocument>("ErrorLog", errorLogSchema);

export { type ErrorLogDocument, ErrorLogModel, type ErrorLogSchema };
