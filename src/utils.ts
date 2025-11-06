import bcrypt from "bcryptjs";
import type { GraphQLResolveInfo } from "graphql";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { Buffer } from "node:buffer";
import tsresults, { type ErrImpl, type OkImpl, type Option } from "ts-results";
import { PROPERTY_DESCRIPTOR, STATUS_DESCRIPTION_TABLE } from "./constants.ts";
import {
    AppErrorBase,
    HashComparisonError,
    HashGenerationError,
    TokenDecodeError,
    TokenSignatureError,
    TokenVerificationError,
} from "./errors/index.ts";
import {
    ErrorLogModel,
    type ErrorLogSchema,
} from "./resources/errorLog/model.ts";
import { createNewResourceService } from "./services/index.ts";
import type {
    DecodedToken,
    RequestAfterSuccessfulAuth,
    SafeError,
    SafeResult,
    ServerErrorResponseGraphQL,
    ServerResponseGraphQL,
    ServerSuccessResponseGraphQL,
} from "./types.ts";
const { Err, None, Ok, Some } = tsresults;

function createErrorLogSchema(
    safeErrorResult: ErrImpl<SafeError>,
    request: RequestAfterSuccessfulAuth,
): ErrorLogSchema {
    const { message, name, original, stack, timestamp } = safeErrorResult.val;
    const { headers, decodedToken } = request;
    const { sessionId, userId, username } = decodedToken;
    const { ip } = headers;

    const errorLog: ErrorLogSchema = {
        message,
        name,
        stack: stack.none ? "ｶ ｷ ｸ ｹ ｺ ｻ ｼ ｽ" : stack.val,
        original: original.none ? "ｾ ｿ ﾀ ﾁ ﾂ ﾃ ﾄ ﾅ" : original.val,
        sessionId: sessionId.toString(),
        userId: userId.toString(),
        username,
        timestamp,
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
    if (request.headers["user-agent"]) {
        Object.defineProperty(errorLog, "userAgent", {
            value: request.headers["user-agent"],
            ...PROPERTY_DESCRIPTOR,
        });
    }

    return errorLog;
}

async function handleCatchBlockError(
    error: unknown | AppErrorBase,
    request: RequestAfterSuccessfulAuth,
): Promise<ServerErrorResponseGraphQL> {
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

        return createServerErrorResponse({
            request,
            statusCode: 500,
        });
    } catch (_error: unknown) {
        return createServerErrorResponse({
            request,
            statusCode: 500,
        });
    }
}

async function handleErrorResult(
    safeErrorResult: ErrImpl<SafeError>,
    request: RequestAfterSuccessfulAuth,
): Promise<ServerErrorResponseGraphQL> {
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

        return createServerErrorResponse({
            request,
            statusCode: 500,
        });
    } catch (_error: unknown) {
        return createServerErrorResponse({
            request,
            statusCode: 500,
        });
    }
}

function createServerErrorResponse({
    request,
    dataBox = [],
    statusCode = 500,
    message = STATUS_DESCRIPTION_TABLE[statusCode] ?? "Internal Server Error",
    totalDocuments,
    totalPages,
}: {
    request: RequestAfterSuccessfulAuth;
    dataBox?: [];
    statusCode?: number;
    message?: string;
    totalDocuments?: number;
    totalPages?: number;
}): ServerErrorResponseGraphQL {
    const { accessToken = "" } = request;
    const response: ServerErrorResponseGraphQL = {
        accessToken,
        dataBox,
        message,
        statusCode,
        timestamp: new Date(),
    };

    // Only add optional properties if they have actual values
    if (totalDocuments !== undefined) {
        response.totalDocuments = totalDocuments;
    }

    if (totalPages !== undefined) {
        response.totalPages = totalPages;
    }

    return response;
}

function createServerSuccessResponse<Data = unknown>({
    request,
    dataBox = [],
    statusCode = 200,
    message = STATUS_DESCRIPTION_TABLE[statusCode] ?? "Internal Server Error",
    totalDocuments,
    totalPages,
}: {
    request: RequestAfterSuccessfulAuth;
    dataBox?: Array<Data>;
    statusCode?: number;
    message?: string;
    totalDocuments?: number;
    totalPages?: number;
}): ServerResponseGraphQL<Data> {
    const { accessToken = "" } = request;
    const response: ServerResponseGraphQL<Data> = {
        accessToken,
        dataBox,
        message,
        statusCode,
        timestamp: new Date(),
    };

    // Only add optional properties if they have actual values
    if (totalDocuments !== undefined) {
        response.totalDocuments = totalDocuments;
    }

    if (totalPages !== undefined) {
        response.totalPages = totalPages;
    }

    return response;
}

function createServerErrorBeforeAuthResponse(
    statusCode = 500,
    message = STATUS_DESCRIPTION_TABLE[statusCode] ?? "Internal Server Error",
) {
    const response: ServerErrorResponseGraphQL = {
        accessToken: "",
        dataBox: [],
        message,
        statusCode,
        timestamp: new Date(),
    };

    return response;
}

function createServerSuccessBeforeAuthResponse<Data = unknown>(
    dataBox: Array<Data> = [],
    statusCode = 200,
    message = STATUS_DESCRIPTION_TABLE[statusCode] ?? "OK",
): ServerResponseGraphQL<Data> {
    const response: ServerSuccessResponseGraphQL<Data> = {
        accessToken: "",
        dataBox,
        message,
        statusCode,
        timestamp: new Date(),
    };

    return response;
}

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
    error: AppErrorBase | unknown,
): ErrImpl<SafeError> {
    // TODO: Handle custom AppErrorBase instances separately
    if (error instanceof AppErrorBase) {
        return new Err({
            name: error.name,
            message: error.message,
            stack: None,
            original: None,
            timestamp: new Date().toISOString(),
        });
    }

    if (error instanceof Error) {
        return new Err({
            name: error.name ?? "Error",
            message: error.message ?? "Unknown error",
            stack: error.stack == null ? None : Some(error.stack),
            original: None,
            timestamp: new Date().toISOString(),
        });
    }

    if (typeof error === "string") {
        return new Err({
            name: "Error",
            message: error,
            stack: None,
            original: None,
            timestamp: new Date().toISOString(),
        });
    }

    if (typeof error === "object" && error !== null) {
        return new Err({
            name: "Error",
            message: "An error occurred",
            stack: None,
            original: Some(serializeSafe(error)),
            timestamp: new Date().toISOString(),
        });
    }

    return new Err({
        name: "SimulationDysfunction",
        message: "You've seen it before. Déjà vu. Something's off...",
        stack: None,
        original: Some(serializeSafe(error)),
        timestamp: new Date().toISOString(),
    });
}

/**
 * Extracts MongoDB projection object from GraphQL query selection info.
 *
 * This function analyzes GraphQL field selections and converts them into a MongoDB
 * projection object format, where each selected field maps to the value 1.
 * It handles special cases like filtering out server response fields and extracting
 * nested selections from a "dataBox" field.
 *
 * @param info - GraphQL resolve info object containing query field selections
 * @returns A MongoDB projection object with selected field names as keys and 1 as values
 *
 * @remarks
 * - Filters out server response fields like "accessToken", "message", "statusCode", etc.
 * - Special handling for "dataBox" field: extracts nested field selections instead of the container
 * - Only processes GraphQL Field selections, ignoring other selection types
 * - Uses PROPERTY_DESCRIPTOR for defining projection properties
 */
function getProjectionFromInfo(
    info: GraphQLResolveInfo,
): Record<string, 1> {
    const { fieldNodes } = info;
    const selections = fieldNodes[0]?.selectionSet?.selections ?? [];
    const nonProjectionServerResponseFields = new Set([
        "accessToken",
        "message",
        "statusCode",
        "timestamp",
        "totalDocuments",
        "totalPages",
    ]);

    return selections.reduce((projection, selection) => {
        if (selection.kind === "Field") {
            const fieldName = selection.name.value;
            if (nonProjectionServerResponseFields.has(fieldName)) {
                return projection;
            }

            if (fieldName === "dataBox" && selection.selectionSet) {
                const dataBoxSelections = selection.selectionSet.selections;

                dataBoxSelections.forEach((dataBoxSelection) => {
                    if (dataBoxSelection.kind === "Field") {
                        const dataBoxFieldName = dataBoxSelection.name.value;
                        Object.defineProperty(projection, dataBoxFieldName, {
                            value: 1,
                            ...PROPERTY_DESCRIPTOR,
                        });
                    }
                });
                return projection;
            }
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
        return createSafeErrorResult(new HashComparisonError(error));
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
        return createSafeErrorResult(new HashGenerationError(error));
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
        return createSafeErrorResult(new TokenDecodeError(error));
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
            : createSafeErrorResult(new TokenVerificationError(error));
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
        return createSafeErrorResult(new TokenSignatureError(error));
    }
}

function removeFieldFromObject<
    Obj extends Record<PropertyKey, unknown> = Record<PropertyKey, unknown>,
    Field extends keyof Obj = keyof Obj,
>(
    obj: Obj,
    fieldToRemove: Field,
): Omit<Obj, Field> {
    const { [fieldToRemove]: _, ...rest } = obj;
    return rest;
}

export {
    compareHashedStringWithPlainStringSafe,
    createErrorLogSchema,
    createSafeErrorResult,
    createSafeSuccessResult,
    createServerErrorBeforeAuthResponse,
    createServerErrorResponse,
    createServerSuccessBeforeAuthResponse,
    createServerSuccessResponse,
    decodeJWTSafe,
    getProjectionFromInfo,
    handleCatchBlockError,
    handleErrorResult,
    hashStringSafe,
    removeFieldFromObject,
    serializeSafe,
    signJWTSafe,
    splitResourceIDFromArgs,
    verifyJWTSafe,
};
