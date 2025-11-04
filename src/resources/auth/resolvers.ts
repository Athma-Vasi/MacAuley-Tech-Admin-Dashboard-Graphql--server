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
    createServerErrorResponseGraphQL,
    createServerSuccessResponseGraphQL,
    decodeJWTSafe,
    handleCatchBlockError,
    handleErrorResult,
    hashStringSafe,
    removeFieldFromObject,
    signJWTSafe,
    unwrapResultAndOption,
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
                    return await handleErrorResult(
                        existingUserResult,
                        request,
                    );
                }
                const existsMaybe = existingUserResult.safeUnwrap();
                if (existsMaybe.some) {
                    return createServerSuccessResponseGraphQL({
                        request,
                        statusCode: 200,
                    });
                }

                return createServerErrorResponseGraphQL({
                    request,
                    statusCode: 404,
                });
            } catch (error: unknown) {
                return await handleCatchBlockError(
                    error,
                    context.request,
                );
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
                    return await handleErrorResult(
                        hashPasswordResult,
                        request,
                    );
                }
                const hashedPasswordMaybe = hashPasswordResult.safeUnwrap();
                if (hashedPasswordMaybe.none) {
                    return createServerErrorResponseGraphQL({
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
                    return await handleErrorResult(
                        createUserResult,
                        request,
                    );
                }
                const createdUserMaybe = createUserResult.safeUnwrap();
                if (createdUserMaybe.none) {
                    return createServerErrorResponseGraphQL({
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
                    return await handleErrorResult(
                        createFileUploadResult,
                        request,
                    );
                }
                const createdFileUploadMaybe = createFileUploadResult
                    .safeUnwrap();
                if (createdFileUploadMaybe.none) {
                    return createServerErrorResponseGraphQL({
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
                    return await handleErrorResult(
                        updateUserDocumentResult,
                        request,
                    );
                }
                const updatedUserMaybe = updateUserDocumentResult
                    .safeUnwrap();
                if (updatedUserMaybe.none) {
                    return createServerErrorResponseGraphQL({
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
                    return await handleErrorResult(
                        updateFileUploadResult,
                        request,
                    );
                }
                const updatedFileUploadMaybe = updateFileUploadResult
                    .safeUnwrap();
                if (updatedFileUploadMaybe.none) {
                    return createServerErrorResponseGraphQL({
                        request,
                        statusCode: 500,
                    });
                }

                console.log(
                    "Successfully registered user:",
                    createdUserDocument.username,
                );

                return createServerSuccessResponseGraphQL({
                    request,
                    dataBox: [true],
                });
            } catch (error: unknown) {
                return await handleCatchBlockError(
                    error,
                    context.request,
                );
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
                    return await handleErrorResult(
                        getUserResult,
                        request,
                    );
                }
                const userMaybe = getUserResult.safeUnwrap();
                if (userMaybe.none) {
                    return createServerErrorResponseGraphQL({
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
                    return await handleErrorResult(
                        isPasswordValidResult,
                        request,
                    );
                }
                const isPasswordValidMaybe = isPasswordValidResult.safeUnwrap();
                if (
                    isPasswordValidMaybe.none ||
                    !isPasswordValidMaybe.safeUnwrap()
                ) {
                    return createServerErrorResponseGraphQL({
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
                    return await handleErrorResult(
                        createAuthSessionResult,
                        request,
                    );
                }
                const createdAuthSessionMaybe = createAuthSessionResult
                    .safeUnwrap();
                if (createdAuthSessionMaybe.none) {
                    return createServerErrorResponseGraphQL({
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
                    return await handleErrorResult(
                        accessTokenResult,
                        request,
                    );
                }
                const accessTokenMaybe = accessTokenResult.safeUnwrap();
                if (accessTokenMaybe.none) {
                    return createServerErrorResponseGraphQL({
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
                    return await handleErrorResult(
                        updateSessionResult,
                        request,
                    );
                }
                const updatedSessionMaybe = updateSessionResult.safeUnwrap();
                if (updatedSessionMaybe.none) {
                    return createServerErrorResponseGraphQL({
                        request,
                        statusCode: 500,
                    });
                }

                console.log(
                    `User ${userDocument.username} logged in successfully.`,
                );

                const userDocWithoutPassword = removeFieldFromObject(
                    userDocument,
                    "password",
                );

                return createServerSuccessResponseGraphQL({
                    request,
                    dataBox: [userDocWithoutPassword],
                });
            } catch (error: unknown) {
                return await handleCatchBlockError(
                    error,
                    context.request,
                );
            }
        },

        logoutUser: async (
            _: unknown,
            args: { accessToken: string },
            context: { request: Request },
        ): Promise<boolean | null> => {
            try {
                const { accessToken } = args;
                const { ACCESS_TOKEN_SEED } = CONFIG;

                // verify that the access token is valid
                const verifyTokenResult = verifyJWTSafe({
                    seed: ACCESS_TOKEN_SEED,
                    token: accessToken,
                });
                const verifiedToken = await unwrapResultAndOption(
                    verifyTokenResult,
                    request,
                );
                if (verifiedToken == null) {
                    return null;
                }

                // decode token
                const decodedTokenResult = decodeJWTSafe(accessToken);
                const decodedToken = await unwrapResultAndOption(
                    decodedTokenResult,
                    request,
                );
                if (decodedToken == null) {
                    return null;
                }
                const sessionId = decodedToken.sessionId.toString();

                // delete auth session
                const deleteAuthSessionResult = await deleteResourceByIdService(
                    sessionId,
                    AuthModel,
                );

                const isDeleted = await unwrapResultAndOption(
                    deleteAuthSessionResult,
                    request,
                );
                if (isDeleted == null) {
                    return null;
                }

                console.log(
                    `User with session ID ${sessionId} logged out successfully.`,
                );

                return isDeleted;
            } catch (error: unknown) {
                return await handleCatchBlockError(
                    error,
                    request,
                );
            }
        },
    },
};

export { authResolvers };
