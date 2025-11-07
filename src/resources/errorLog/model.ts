import { model, Schema, type Types } from "mongoose";
import { ERROR_LOG_EXPIRY } from "../../constants.ts";

type ErrorLogSchema = {
    headers?: string;
    ip?: string;
    userAgent?: string;
    original: string;
    expireAt?: Date;
    userId: string;
    username: string;
    sessionId: string;
    message: string;
    name: string;
    stack: string;
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
            required: [true, "Original error is required. Received {VALUE}"],
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
        },
        sessionId: {
            type: String,
            required: [true, "Session ID is required. Received {VALUE}"],
            index: true,
        },
        message: {
            type: String,
            required: [true, "Message is required. Received {VALUE}"],
        },
        name: {
            type: String,
            required: [true, "Name is required. Received {VALUE}"],
        },
        stack: {
            type: String,
            required: [true, "Stack is required. Received {VALUE}"],
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
