import type { Request } from "express";
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
import type { ServerResponseGraphQL } from "../../types.ts";
import {
    compareHashedStringWithPlainStringSafe,
    createServerErrorResponse,
    createServerSuccessResponse,
    decodeJWTSafe,
    handleCatchBlockError,
    handleErrorResult,
    hashStringSafe,
    removeFieldFromObject,
    signJWTSafe,
    verifyJWTSafe,
} from "../../utils.ts";
import { FileUploadModel, type FileUploadSchema } from "../fileUpload/model.ts";
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
            context: { request: Request },
        ): Promise<ServerResponseGraphQL<boolean>> => {
            try {
                const { request } = context;
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
                    try {
                        return await handleErrorResult(
                            existingUserResult,
                            request,
                        );
                    } catch (_error: unknown) {
                        return createServerErrorResponse({
                            request,
                            statusCode: 500,
                        });
                    }
                }
                const existsMaybe = existingUserResult.safeUnwrap();
                if (existsMaybe.some) {
                    return createServerSuccessResponse({
                        request,
                        statusCode: 200,
                    });
                }

                return createServerErrorResponse({
                    request,
                    statusCode: 404,
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

    Mutation: {
        registerUser: async (
            _: unknown,
            args: UserSchema,
            context: { request: Request },
        ): Promise<ServerResponseGraphQL<boolean>> => {
            try {
                const { request } = context;

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
                    try {
                        return await handleErrorResult(
                            hashPasswordResult,
                            request,
                        );
                    } catch (_error: unknown) {
                        return createServerErrorResponse({
                            request,
                            statusCode: 500,
                        });
                    }
                }
                const hashedPasswordMaybe = hashPasswordResult.safeUnwrap();
                if (hashedPasswordMaybe.none) {
                    return createServerErrorResponse({
                        request,
                        statusCode: 500,
                    });
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
                    try {
                        return await handleErrorResult(
                            createUserResult,
                            request,
                        );
                    } catch (_error: unknown) {
                        return createServerErrorResponse({
                            request,
                            statusCode: 500,
                        });
                    }
                }
                const createdUserMaybe = createUserResult.safeUnwrap();
                if (createdUserMaybe.none) {
                    return createServerErrorResponse({
                        request,
                        statusCode: 500,
                    });
                }
                const createdUserDocument = createdUserMaybe.safeUnwrap();

                const { fileUploads } = context.request.body;
                const fileUploadSchema: FileUploadSchema = {
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
                    try {
                        return await handleErrorResult(
                            createFileUploadResult,
                            request,
                        );
                    } catch (_error: unknown) {
                        return createServerErrorResponse({
                            request,
                            statusCode: 500,
                        });
                    }
                }
                const createdFileUploadMaybe = createFileUploadResult
                    .safeUnwrap();
                if (createdFileUploadMaybe.none) {
                    return createServerErrorResponse({
                        request,
                        statusCode: 500,
                    });
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
                    try {
                        return await handleErrorResult(
                            updateUserDocumentResult,
                            request,
                        );
                    } catch (_error: unknown) {
                        return createServerErrorResponse({
                            request,
                            statusCode: 500,
                        });
                    }
                }
                const updatedUserMaybe = updateUserDocumentResult
                    .safeUnwrap();
                if (updatedUserMaybe.none) {
                    return createServerErrorResponse({
                        request,
                        statusCode: 500,
                    });
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
                    try {
                        return await handleErrorResult(
                            updateFileUploadResult,
                            request,
                        );
                    } catch (_error: unknown) {
                        return createServerErrorResponse({
                            request,
                            statusCode: 500,
                        });
                    }
                }
                const updatedFileUploadMaybe = updateFileUploadResult
                    .safeUnwrap();
                if (updatedFileUploadMaybe.none) {
                    return createServerErrorResponse({
                        request,
                        statusCode: 500,
                    });
                }

                console.log(
                    "Successfully registered user:",
                    createdUserDocument.username,
                );

                return createServerSuccessResponse({
                    request,
                    dataBox: [true],
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

        loginUser: async (
            _: unknown,
            args: { username: string; password: string },
            context: { request: Request },
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

                // create auth session (without token yet)
                const authSessionSchema: AuthSchema = {
                    addressIP: request.ip ?? "unknown",
                    currentlyActiveToken: "notAToken",
                    expireAt: new Date(AUTH_SESSION_EXPIRY), // 24 hours
                    userAgent: request.get("User-Agent") ?? "unknown",
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
                        ip: request.ip ?? "unknown",
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
            context: { request: Request },
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
