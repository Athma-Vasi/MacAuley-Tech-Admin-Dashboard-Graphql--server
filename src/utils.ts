import type { Request } from "express";
import type { GraphQLResolveInfo } from "graphql";
import tsresults, { type ErrImpl, type OkImpl, type Option } from "ts-results";
import { PROPERTY_DESCRIPTOR } from "./constants.ts";
import {
    ErrorLogModel,
    type ErrorLogSchema,
} from "./resources/errorLog/model.ts";
import { createNewResourceService } from "./services/index.ts";
import type { DecodedToken, SafeError, SafeResult } from "./types.ts";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { Buffer } from "node:buffer";
const { Err, None, Ok, Some } = tsresults;

function createSafeSuccessResult<Data = unknown>(
    data: Data,
): OkImpl<Option<NonNullable<Data>>> {
    return new Ok(data == null || data == undefined ? None : Some(data));
}

function serializeSafe(data: unknown): string {
    try {
        const serializedData = JSON.stringify(data, null, 2);
        return serializedData;
    } catch (_error: unknown) {
        return "Unserializable data";
    }
}

function createSafeErrorResult(
    error: unknown,
): ErrImpl<SafeError> {
    if (error instanceof Error) {
        return new Err({
            name: error.name ?? "Error",
            message: error.message ?? "Unknown error",
            stack: error.stack == null ? None : Some(error.stack),
            original: None,
        });
    }

    if (typeof error === "string") {
        return new Err({
            name: "Error",
            message: error,
            stack: None,
            original: None,
        });
    }

    if (error instanceof Event) {
        if (error instanceof PromiseRejectionEvent) {
            return new Err({
                name: `PromiseRejectionEvent: ${error.type}`,
                message: error.reason.toString() ?? "No reason provided",
                stack: None,
                original: Some(serializeSafe(error)),
            });
        }

        return new Err({
            name: `EventError: ${error.type}`,
            message: error.timeStamp.toString() ?? "No timestamp provided",
            stack: None,
            original: Some(serializeSafe(error)),
        });
    }

    return new Err({
        name: "SimulationDysfunction",
        message: "You've seen it before. Déjà vu. Something's off...",
        stack: None,
        original: Some(serializeSafe(error)),
    });
}

function getProjectionFromInfo(
    info: GraphQLResolveInfo,
): Record<string, 1> {
    const { fieldNodes } = info;
    const selections = fieldNodes[0]?.selectionSet?.selections ?? [];

    return selections.reduce((projection, selection) => {
        if (selection.kind === "Field") {
            const fieldName = selection.name.value;
            Object.defineProperty(projection, fieldName, {
                value: 1,
                ...PROPERTY_DESCRIPTOR,
            });
        }

        return projection;
    }, {});
}

function splitResourceIDFromArgs<
    Doc extends Record<PropertyKey, unknown> = Record<PropertyKey, unknown>,
>(
    args: Doc,
): { resourceId: string; updateFields: Omit<Doc, "_id"> } {
    return Object.entries(args)
        .reduce(
            (acc, [key, value]) => {
                if (key === "_id") {
                    Object.defineProperty(acc, "resourceId", {
                        value: value,
                        ...PROPERTY_DESCRIPTOR,
                    });
                    return acc;
                }

                Object.defineProperty(acc.updateFields, key, {
                    value: value,
                    ...PROPERTY_DESCRIPTOR,
                });

                return acc;
            },
            {
                resourceId: "",
                updateFields: {} as Omit<Doc, "_id">,
            },
        );
}

function createErrorLogSchema(
    safeErrorResult: ErrImpl<SafeError>,
    request: Request,
): ErrorLogSchema {
    const { message, name, original, stack } = safeErrorResult.val;
    const { body = {} } = request;
    const { username = "unknown", userId = "unknown", sessionId = "unknown" } =
        body;
    const { headers, ip, method, path } = request;

    const errorLog: ErrorLogSchema = {
        message: message,
        name: name,
        stack: stack.none ? "ｶ ｷ ｸ ｹ ｺ ｻ ｼ ｽ" : stack.val,
        original: original.none ? "ｾ ｿ ﾀ ﾁ ﾂ ﾃ ﾄ ﾅ" : original.val,
        body: serializeSafe(body),
        sessionId: sessionId.toString(),
        userId: userId.toString(),
        username: username,
    };

    if (headers) {
        Object.defineProperty(errorLog, "headers", {
            value: serializeSafe(headers),
            ...PROPERTY_DESCRIPTOR,
        });
    }
    if (ip) {
        Object.defineProperty(errorLog, "ip", {
            value: ip,
            ...PROPERTY_DESCRIPTOR,
        });
    }
    if (method) {
        Object.defineProperty(errorLog, "method", {
            value: method,
            ...PROPERTY_DESCRIPTOR,
        });
    }
    if (path) {
        Object.defineProperty(errorLog, "path", {
            value: path,
            ...PROPERTY_DESCRIPTOR,
        });
    }
    if (request.headers["user-agent"]) {
        Object.defineProperty(errorLog, "userAgent", {
            value: request.headers["user-agent"],
            ...PROPERTY_DESCRIPTOR,
        });
    }

    return errorLog;
}

async function handleCatchBlockError(
    error: unknown,
    request: Request,
): Promise<null> {
    try {
        console.error("handling catch block error: ", error);

        const safeErrorResult = createSafeErrorResult(error);
        const errorLogSchema = createErrorLogSchema(
            safeErrorResult,
            request,
        );
        await createNewResourceService(
            errorLogSchema,
            ErrorLogModel,
        );

        return null;
    } catch (_error: unknown) {
        return null;
    }
}

async function handleErrorResult(
    safeErrorResult: ErrImpl<SafeError>,
    request: Request,
): Promise<null> {
    try {
        console.error(
            "handling error result: ",
            safeErrorResult.mapErr((e) => e),
        );

        const errorLogSchema = createErrorLogSchema(
            safeErrorResult,
            request,
        );
        await createNewResourceService(
            errorLogSchema,
            ErrorLogModel,
        );

        return null;
    } catch (_error: unknown) {
        return null;
    }
}

async function compareHashedStringWithPlainStringSafe({
    hashedString,
    plainString,
}: {
    hashedString: string;
    plainString: string;
}): Promise<SafeResult<boolean>> {
    try {
        const isMatch = await bcrypt.compare(plainString, hashedString);
        return createSafeSuccessResult(isMatch);
    } catch (error: unknown) {
        return createSafeErrorResult(error);
    }
}

async function hashStringSafe({ saltRounds, stringToHash }: {
    saltRounds: number;
    stringToHash: string;
}): Promise<SafeResult<string>> {
    try {
        const hashedString = await bcrypt.hash(stringToHash, saltRounds);
        return createSafeSuccessResult(hashedString);
    } catch (error: unknown) {
        return createSafeErrorResult(error);
    }
}

function decodeJWTSafe(
    token: string,
): SafeResult<DecodedToken> {
    try {
        const decoded = jwt.decode(token, { json: true }) as
            | DecodedToken
            | null;
        return createSafeSuccessResult(decoded);
    } catch (error: unknown) {
        return createSafeErrorResult(error);
    }
}

function verifyJWTSafe(
    { seed, token }: {
        seed: string;
        token: string;
    },
): SafeResult<DecodedToken> {
    try {
        const decoded = jwt.verify(token, seed) as DecodedToken;
        return createSafeSuccessResult(decoded);
    } catch (error: unknown) {
        return error instanceof Error && error?.name === "TokenExpiredError"
            ? new Ok(None)
            : createSafeErrorResult(error);
    }
}

function signJWTSafe({ payload, secretOrPrivateKey, options }: {
    payload: string | Buffer | object;
    secretOrPrivateKey: jwt.Secret | jwt.PrivateKey;
    options?: SignOptions;
}) {
    try {
        const token = jwt.sign(payload, secretOrPrivateKey, options);
        return createSafeSuccessResult(token);
    } catch (error: unknown) {
        return createSafeErrorResult(error);
    }
}

export {
    compareHashedStringWithPlainStringSafe,
    createErrorLogSchema,
    createSafeErrorResult,
    createSafeSuccessResult,
    decodeJWTSafe,
    getProjectionFromInfo,
    handleCatchBlockError,
    handleErrorResult,
    hashStringSafe,
    signJWTSafe,
    splitResourceIDFromArgs,
    verifyJWTSafe,
};
