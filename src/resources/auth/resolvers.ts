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
import {
    compareHashedStringWithPlainStringSafe,
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
import { UserModel, type UserSchema } from "../user/model.ts";
import { AuthModel, type AuthSchema } from "./model.ts";

const authResolvers = {
    Query: {
        getAuthSessionById: getResourceByIdResolver(AuthModel),

        checkUsernameOrEmailExists: async (
            _: unknown,
            args: { username?: string; email?: string },
            context: { req: Request },
        ): Promise<boolean> => {
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
                    await handleErrorResult(
                        existingUserResult,
                        context.req,
                    );
                    return true;
                }
                const existsMaybe = existingUserResult.safeUnwrap();
                if (existsMaybe.some) {
                    return true;
                }

                return false;
            } catch (error: unknown) {
                await handleCatchBlockError(
                    error,
                    context.req,
                );
                return true;
            }
        },
    },

    Mutation: {
        registerUser: async (
            _: unknown,
            args: UserSchema,
            context: { req: Request },
        ) => {
            try { // assuming that username and email were already checked for existence
                const hashPasswordResult = await hashStringSafe({
                    saltRounds: HASH_SALT_ROUNDS,
                    stringToHash: args.password,
                });
                const hashedPassword = await unwrapResultAndOption(
                    hashPasswordResult,
                    context.req,
                );
                if (hashedPassword == null) {
                    return null;
                }

                const userSchema = {
                    ...args,
                    password: hashedPassword,
                };

                const createUserResult = await createNewResourceService(
                    userSchema,
                    UserModel,
                );
                const createdUserDocument = await unwrapResultAndOption(
                    createUserResult,
                    context.req,
                );
                if (createdUserDocument == null) {
                    return null;
                }

                const { fileUploads } = context.req.body;
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
                const createdFileUploadDocument = await unwrapResultAndOption(
                    createFileUploadResult,
                    context.req,
                );
                if (createdFileUploadDocument == null) {
                    return null;
                }

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
                const updatedUserDocument = await unwrapResultAndOption(
                    updateUserDocumentResult,
                    context.req,
                );
                if (updatedUserDocument == null) {
                    return null;
                }

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
                        context.req,
                    );
                }
                const updatedFileUploadMaybe = updateFileUploadResult
                    .safeUnwrap();
                if (updatedFileUploadMaybe.none) {
                    return null;
                }

                console.log(
                    "Successfully registered user:",
                    createdUserDocument.username,
                );

                return createdUserDocument;
            } catch (error: unknown) {
                return await handleCatchBlockError(
                    error,
                    context.req,
                );
            }
        },

        loginUser: async (
            _: unknown,
            args: { username: string; password: string },
            context: { req: Request },
        ) => {
            try {
                const { password, username } = args;
                // check if user with username exists
                const getUserResult = await getResourceByFieldService({
                    model: UserModel,
                    filter: { username },
                    projection: {},
                    options: {},
                });
                const userDocument = await unwrapResultAndOption(
                    getUserResult,
                    context.req,
                );
                if (userDocument == null) {
                    return null;
                }

                // verify password
                const isPasswordValidResult =
                    await compareHashedStringWithPlainStringSafe({
                        hashedString: userDocument.password,
                        plainString: password,
                    });
                const isPasswordValid = await unwrapResultAndOption(
                    isPasswordValidResult,
                    context.req,
                );
                if (isPasswordValid == null || !isPasswordValid) {
                    return null;
                }

                const { ACCESS_TOKEN_SEED } = CONFIG;

                // create auth session (without token yet)
                const authSessionSchema: AuthSchema = {
                    addressIP: context.req.ip ?? "unknown",
                    currentlyActiveToken: "notAToken",
                    expireAt: new Date(AUTH_SESSION_EXPIRY), // 24 hours
                    userAgent: context.req.get("User-Agent") ?? "unknown",
                    userId: userDocument._id,
                    username: userDocument.username,
                };

                const createAuthSessionResult = await createNewResourceService(
                    authSessionSchema,
                    AuthModel,
                );
                const createdAuthSessionDocument = await unwrapResultAndOption(
                    createAuthSessionResult,
                    context.req,
                );
                if (createdAuthSessionDocument == null) {
                    return null;
                }

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
                const accessToken = await unwrapResultAndOption(
                    accessTokenResult,
                    context.req,
                );
                if (accessToken == null) {
                    return null;
                }

                // update the session with the new access token
                const updateSessionResult = await updateResourceByIdService({
                    updateFields: {
                        currentlyActiveToken: accessToken,
                        ip: context.req.ip ?? "unknown",
                        userAgent: context.req.headers["user-agent"] ??
                            "unknown",
                    },
                    model: AuthModel,
                    resourceId: createdAuthSessionDocument._id
                        .toString(),
                    updateOperator: "$set",
                });
                const updatedSessionDocument = await unwrapResultAndOption(
                    updateSessionResult,
                    context.req,
                );
                if (updatedSessionDocument == null) {
                    return null;
                }

                console.log(
                    `User ${userDocument.username} logged in successfully.`,
                );

                const userDocWithoutPassword = removeFieldFromObject(
                    userDocument,
                    "password",
                );
                return {
                    user: userDocWithoutPassword,
                    accessToken: accessToken,
                };
            } catch (error: unknown) {
                return await handleCatchBlockError(
                    error,
                    context.req,
                );
            }
        },

        logoutUser: async (
            _: unknown,
            args: { accessToken: string },
            context: { req: Request },
        ) => {
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
                    context.req,
                );
                if (verifiedToken == null) {
                    return null;
                }

                // decode token
                const decodedTokenResult = decodeJWTSafe(accessToken);
                const decodedToken = await unwrapResultAndOption(
                    decodedTokenResult,
                    context.req,
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
                    context.req,
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
                    context.req,
                );
            }
        },
    },
};

export { authResolvers };
