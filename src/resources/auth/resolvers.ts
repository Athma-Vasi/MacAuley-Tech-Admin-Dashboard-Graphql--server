import { CONFIG } from "../../config/index.ts";
import {
    ACCESS_TOKEN_EXPIRY,
    AUTH_SESSION_EXPIRY,
    HASH_SALT_ROUNDS,
} from "../../constants.ts";
import { getResourceByIdResolver } from "../../resolvers/index.ts";
import {
    createNewResourceService,
    deleteResourceByIdService,
    getResourceByFieldService,
    updateResourceByIdService,
} from "../../services/index.ts";
import type {
    RequestAfterSuccessfulAuth,
    RequestBeforeAuth,
    ServerResponseGraphQL,
} from "../../types.ts";
import {
    compareHashedStringWithPlainStringSafe,
    createServerErrorBeforeAuthResponse,
    createServerErrorResponse,
    createServerSuccessBeforeAuthResponse,
    createServerSuccessResponse,
    decodeJWTSafe,
    handleCatchBlockError,
    handleErrorResult,
    hashStringSafe,
    removeFieldFromObject,
    signJWTSafe,
    verifyJWTSafe,
} from "../../utils.ts";
import { FileUploadModel } from "../fileUpload/model.ts";
import {
    type UserDocument,
    UserModel,
    type UserSchema,
} from "../user/model.ts";
import { AuthModel, type AuthSchema } from "./model.ts";

const authResolvers = {
    Query: {
        getAuthSessionById: getResourceByIdResolver(AuthModel),

        checkUsernameOrEmailExists: async (
            _: unknown,
            args: { username?: string; email?: string },
            _context: { request: RequestBeforeAuth },
        ): Promise<ServerResponseGraphQL<boolean>> => {
            try {
                console.log(
                    "Checking if username or email exists at register:",
                    args.username,
                );

                const existingUserResult = await getResourceByFieldService({
                    model: AuthModel,
                    filter: args,
                    projection: {},
                    options: {},
                });
                if (existingUserResult.err) {
                    return createServerErrorBeforeAuthResponse();
                }
                const existsMaybe = existingUserResult.safeUnwrap();
                if (existsMaybe.some) {
                    return createServerSuccessBeforeAuthResponse(
                        [true],
                    );
                }

                return createServerSuccessBeforeAuthResponse(
                    [false],
                );
            } catch (_error: unknown) {
                return createServerErrorBeforeAuthResponse();
            }
        },
    },

    Mutation: {
        registerUser: async (
            _: unknown,
            args: UserSchema,
            context: {
                request: RequestBeforeAuth & { fileUploads: Array<File> };
            },
        ): Promise<ServerResponseGraphQL<boolean>> => {
            try {
                console.log(
                    "Registering new user:",
                    args.username,
                );
                // assuming that username and email were already checked for existence
                const hashPasswordResult = await hashStringSafe({
                    saltRounds: HASH_SALT_ROUNDS,
                    stringToHash: args.password,
                });
                if (hashPasswordResult.err) {
                    return createServerErrorBeforeAuthResponse();
                }
                const hashedPasswordMaybe = hashPasswordResult.safeUnwrap();
                if (hashedPasswordMaybe.none) {
                    return createServerErrorBeforeAuthResponse();
                }
                const hashedPassword = hashedPasswordMaybe.safeUnwrap();

                const userSchema = {
                    ...args,
                    password: hashedPassword,
                };

                const createUserResult = await createNewResourceService(
                    userSchema,
                    UserModel,
                );
                if (createUserResult.err) {
                    return createServerErrorBeforeAuthResponse();
                }
                const createdUserMaybe = createUserResult.safeUnwrap();
                if (createdUserMaybe.none) {
                    return createServerErrorBeforeAuthResponse();
                }
                const createdUserDocument = createdUserMaybe.safeUnwrap();

                const { fileUploads } = context.request;
                const fileUploadSchema = {
                    ...fileUploads[0],
                    associatedDocumentId: createdUserDocument._id,
                    userId: createdUserDocument._id,
                    username: createdUserDocument.username,
                };
                // create file upload document for profile picture
                const createFileUploadResult = await createNewResourceService(
                    fileUploadSchema,
                    FileUploadModel,
                );
                if (createFileUploadResult.err) {
                    return createServerErrorBeforeAuthResponse();
                }
                const createdFileUploadMaybe = createFileUploadResult
                    .safeUnwrap();
                if (createdFileUploadMaybe.none) {
                    return createServerErrorBeforeAuthResponse();
                }
                const createdFileUploadDocument = createdFileUploadMaybe
                    .safeUnwrap();

                // update user document with profile picture file upload id
                const updateUserDocumentResult =
                    await updateResourceByIdService({
                        resourceId: createdUserDocument._id.toString(),
                        model: UserModel,
                        updateFields: {
                            fileUploadId: createdFileUploadDocument._id,
                        },
                        updateOperator: "$set",
                    });
                if (updateUserDocumentResult.err) {
                    return createServerErrorBeforeAuthResponse();
                }
                const updatedUserMaybe = updateUserDocumentResult
                    .safeUnwrap();
                if (updatedUserMaybe.none) {
                    return createServerErrorBeforeAuthResponse();
                }
                const updatedUserDocument = updatedUserMaybe.safeUnwrap();

                // update the file upload document to maintain
                // a bidirectional relationship with the user.
                const updateFileUploadResult = await updateResourceByIdService({
                    resourceId: createdFileUploadDocument._id.toString(),
                    model: FileUploadModel,
                    updateFields: {
                        associatedDocumentId: updatedUserDocument._id,
                    },
                    updateOperator: "$set",
                });
                if (updateFileUploadResult.err) {
                    return createServerErrorBeforeAuthResponse();
                }
                const updatedFileUploadMaybe = updateFileUploadResult
                    .safeUnwrap();
                if (updatedFileUploadMaybe.none) {
                    return createServerErrorBeforeAuthResponse();
                }

                console.log(
                    "Successfully registered user:",
                    createdUserDocument.username,
                );

                return createServerSuccessBeforeAuthResponse(
                    [true],
                );
            } catch (error: unknown) {
                console.error("Error in registerUser resolver:", error);
                return createServerErrorBeforeAuthResponse();
            }
        },

        loginUser: async (
            _: unknown,
            args: { username: string; password: string },
            context: { request: RequestAfterSuccessfulAuth },
        ): Promise<ServerResponseGraphQL<Omit<UserDocument, "password">>> => {
            try {
                const { request } = context;
                const { password, username } = args;

                // check if user with username exists
                const getUserResult = await getResourceByFieldService({
                    model: UserModel,
                    filter: { username },
                    projection: {},
                    options: {},
                });
                if (getUserResult.err) {
                    try {
                        return await handleErrorResult(
                            getUserResult,
                            request,
                        );
                    } catch (_error: unknown) {
                        return createServerErrorResponse({
                            request,
                            statusCode: 500,
                        });
                    }
                }
                const userMaybe = getUserResult.safeUnwrap();
                if (userMaybe.none) {
                    return createServerErrorResponse({
                        request,
                        statusCode: 404,
                    });
                }
                const userDocument = userMaybe.safeUnwrap();

                // verify password
                const isPasswordValidResult =
                    await compareHashedStringWithPlainStringSafe({
                        hashedString: userDocument.password,
                        plainString: password,
                    });
                if (isPasswordValidResult.err) {
                    try {
                        return await handleErrorResult(
                            isPasswordValidResult,
                            request,
                        );
                    } catch (_error: unknown) {
                        return createServerErrorResponse({
                            request,
                            statusCode: 500,
                        });
                    }
                }
                const isPasswordValidMaybe = isPasswordValidResult.safeUnwrap();
                if (
                    isPasswordValidMaybe.none ||
                    !isPasswordValidMaybe.safeUnwrap()
                ) {
                    return createServerErrorResponse({
                        request,
                        statusCode: 401,
                    });
                }

                const { ACCESS_TOKEN_SEED } = CONFIG;

                const addressIP = typeof request.headers["ip"] === "string"
                    ? request.headers["ip"]
                    : request.headers["ip"]?.join(", ") ?? "unknown";

                // create auth session (without token yet)
                const authSessionSchema: AuthSchema = {
                    addressIP,
                    currentlyActiveToken: "notAToken",
                    expireAt: new Date(AUTH_SESSION_EXPIRY), // 24 hours
                    userAgent: request.headers["user-agent"] ?? "unknown",
                    userId: userDocument._id,
                    username: userDocument.username,
                };

                const createAuthSessionResult = await createNewResourceService(
                    authSessionSchema,
                    AuthModel,
                );
                if (createAuthSessionResult.err) {
                    try {
                        return await handleErrorResult(
                            createAuthSessionResult,
                            request,
                        );
                    } catch (_error: unknown) {
                        return createServerErrorResponse({
                            request,
                            statusCode: 500,
                        });
                    }
                }
                const createdAuthSessionMaybe = createAuthSessionResult
                    .safeUnwrap();
                if (createdAuthSessionMaybe.none) {
                    return createServerErrorResponse({
                        request,
                        statusCode: 500,
                    });
                }
                const createdAuthSessionDocument = createdAuthSessionMaybe
                    .safeUnwrap();

                // create a new access token and use the session ID to sign the new token
                const accessTokenResult = signJWTSafe({
                    payload: {
                        userId: userDocument._id.toString(),
                        username: userDocument.username,
                        roles: userDocument.roles,
                        sessionId: createdAuthSessionDocument._id.toString(),
                    },
                    secretOrPrivateKey: ACCESS_TOKEN_SEED,
                    options: {
                        expiresIn: ACCESS_TOKEN_EXPIRY,
                    },
                });
                if (accessTokenResult.err) {
                    try {
                        return await handleErrorResult(
                            accessTokenResult,
                            request,
                        );
                    } catch (_error: unknown) {
                        return createServerErrorResponse({
                            request,
                            statusCode: 500,
                        });
                    }
                }
                const accessTokenMaybe = accessTokenResult.safeUnwrap();
                if (accessTokenMaybe.none) {
                    return createServerErrorResponse({
                        request,
                        statusCode: 500,
                    });
                }
                const accessToken = accessTokenMaybe.safeUnwrap();

                // update the session with the new access token
                const updateSessionResult = await updateResourceByIdService({
                    updateFields: {
                        currentlyActiveToken: accessToken,
                        ip: request.headers["ip"] ?? "unknown",
                        userAgent: request.headers["user-agent"] ??
                            "unknown",
                    },
                    model: AuthModel,
                    resourceId: createdAuthSessionDocument._id
                        .toString(),
                    updateOperator: "$set",
                });
                if (updateSessionResult.err) {
                    try {
                        return await handleErrorResult(
                            updateSessionResult,
                            request,
                        );
                    } catch (_error: unknown) {
                        return createServerErrorResponse({
                            request,
                            statusCode: 500,
                        });
                    }
                }
                const updatedSessionMaybe = updateSessionResult.safeUnwrap();
                if (updatedSessionMaybe.none) {
                    return createServerErrorResponse({
                        request,
                        statusCode: 500,
                    });
                }

                console.log(
                    `User ${userDocument.username} logged in successfully.`,
                );

                const userDocWithoutPassword: NonNullable<
                    Omit<UserDocument, "password">
                > = removeFieldFromObject(
                    userDocument,
                    "password",
                );

                return createServerSuccessResponse({
                    request,
                    dataBox: [userDocWithoutPassword],
                });
            } catch (error: unknown) {
                try {
                    return await handleCatchBlockError(
                        error,
                        context.request,
                    );
                } catch (_error: unknown) {
                    return createServerErrorResponse({
                        request: context.request,
                        statusCode: 500,
                    });
                }
            }
        },

        logoutUser: async (
            _: unknown,
            args: { accessToken: string },
            context: { request: RequestAfterSuccessfulAuth },
        ): Promise<ServerResponseGraphQL<boolean>> => {
            try {
                const { request } = context;
                const { accessToken } = args;
                const { ACCESS_TOKEN_SEED } = CONFIG;

                // verify that the access token is valid
                const verifyTokenResult = verifyJWTSafe({
                    seed: ACCESS_TOKEN_SEED,
                    token: accessToken,
                });
                if (verifyTokenResult.err) {
                    try {
                        return await handleErrorResult(
                            verifyTokenResult,
                            request,
                        );
                    } catch (_error: unknown) {
                        return createServerErrorResponse({
                            request,
                            statusCode: 500,
                        });
                    }
                }
                const isTokenValidMaybe = verifyTokenResult.safeUnwrap();
                if (isTokenValidMaybe.none) {
                    return createServerErrorResponse({
                        request,
                        statusCode: 401,
                    });
                }

                // decode token
                const decodedTokenResult = decodeJWTSafe(accessToken);
                if (decodedTokenResult.err) {
                    try {
                        return await handleErrorResult(
                            decodedTokenResult,
                            request,
                        );
                    } catch (_error: unknown) {
                        return createServerErrorResponse({
                            request,
                            statusCode: 500,
                        });
                    }
                }
                const decodedTokenMaybe = decodedTokenResult.safeUnwrap();
                if (decodedTokenMaybe.none) {
                    return createServerErrorResponse({
                        request,
                        statusCode: 500,
                    });
                }
                const decodedToken = decodedTokenMaybe.safeUnwrap();
                const sessionId = decodedToken.sessionId.toString();

                // delete auth session
                const deleteAuthSessionResult = await deleteResourceByIdService(
                    sessionId,
                    AuthModel,
                );
                if (deleteAuthSessionResult.err) {
                    try {
                        return await handleErrorResult(
                            deleteAuthSessionResult,
                            request,
                        );
                    } catch (_error: unknown) {
                        return createServerErrorResponse({
                            request,
                            statusCode: 500,
                        });
                    }
                }
                const isDeletedMaybe = deleteAuthSessionResult.safeUnwrap();
                if (isDeletedMaybe.none) {
                    return createServerErrorResponse({
                        request,
                        statusCode: 500,
                    });
                }
                const isDeleted = isDeletedMaybe.safeUnwrap();

                console.log(
                    `User with session ID ${sessionId} logged out successfully.`,
                );

                return createServerSuccessResponse({
                    request,
                    dataBox: [isDeleted],
                });
            } catch (error: unknown) {
                try {
                    return await handleCatchBlockError(
                        error,
                        context.request,
                    );
                } catch (_error: unknown) {
                    return createServerErrorResponse({
                        request: context.request,
                        statusCode: 500,
                    });
                }
            }
        },
    },
};

export { authResolvers };
