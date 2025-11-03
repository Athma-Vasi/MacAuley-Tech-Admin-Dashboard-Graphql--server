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
                console.group(
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
            // assuming that username and email were already checked for existence

            const hashPasswordResult = await hashStringSafe({
                saltRounds: HASH_SALT_ROUNDS,
                stringToHash: args.password,
            });
            if (hashPasswordResult.err) {
                return await handleErrorResult(
                    hashPasswordResult,
                    context.req,
                );
            }
            const hashedPasswordMaybe = hashPasswordResult.safeUnwrap();
            if (hashedPasswordMaybe.none) {
                return null;
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
                    context.req,
                );
            }
            const createdUserMaybe = createUserResult.safeUnwrap();
            if (createdUserMaybe.none) {
                return null;
            }

            const createdUserDocument = createdUserMaybe.safeUnwrap();

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
            if (createFileUploadResult.err) {
                return await handleErrorResult(
                    createFileUploadResult,
                    context.req,
                );
            }
            const createdFileUploadMaybe = createFileUploadResult.safeUnwrap();
            if (createdFileUploadMaybe.none) {
                return null;
            }
            const createdFileUploadDocument = createdFileUploadMaybe
                .safeUnwrap();

            // update user document with profile picture file upload id
            const updateUserDocumentResult = await updateResourceByIdService({
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
                    context.req,
                );
            }
            const updatedUserDocumentMaybe = updateUserDocumentResult
                .safeUnwrap();
            if (updatedUserDocumentMaybe.none) {
                return null;
            }
            const updatedUserDocument = updatedUserDocumentMaybe
                .safeUnwrap();

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
            const updatedFileUploadMaybe = updateFileUploadResult.safeUnwrap();
            if (updatedFileUploadMaybe.none) {
                return null;
            }

            console.log(
                "Successfully registered user:",
                createdUserDocument.username,
            );

            return createdUserDocument;
        },

        loginUser: async (
            _: unknown,
            args: { username: string; password: string },
            context: { req: Request },
        ) => {
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
                    context.req,
                );
            }
            const userMaybe = getUserResult.safeUnwrap();
            if (userMaybe.none) {
                return null;
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
                    context.req,
                );
            }
            const isPasswordValidMaybe = isPasswordValidResult.safeUnwrap();
            if (isPasswordValidMaybe.none) {
                return null;
            }
            const isPasswordValid = isPasswordValidMaybe.safeUnwrap();
            if (!isPasswordValid) {
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
            if (createAuthSessionResult.err) {
                return await handleErrorResult(
                    createAuthSessionResult,
                    context.req,
                );
            }
            const createdAuthSessionMaybe = createAuthSessionResult
                .safeUnwrap();
            if (createdAuthSessionMaybe.none) {
                return null;
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
                    context.req,
                );
            }
            const accessTokenMaybe = accessTokenResult.safeUnwrap();
            if (accessTokenMaybe.none) {
                return null;
            }
            const accessToken = accessTokenMaybe.safeUnwrap();

            // update the session with the new access token
            const updateSessionResult = await updateResourceByIdService({
                updateFields: {
                    currentlyActiveToken: accessToken,
                    ip: context.req.ip ?? "unknown",
                    userAgent: context.req.headers["user-agent"] ?? "unknown",
                },
                model: AuthModel,
                resourceId: createdAuthSessionDocument._id
                    .toString(),
                updateOperator: "$set",
            });
            if (updateSessionResult.err) {
                return await handleErrorResult(
                    updateSessionResult,
                    context.req,
                );
            }
            const updatedSessionMaybe = updateSessionResult.safeUnwrap();
            if (updatedSessionMaybe.none) {
                return null;
            }

            const userDocWithoutPassword = removeFieldFromObject(
                userDocument,
                "password",
            );
            return {
                user: userDocWithoutPassword,
                accessToken: accessToken,
            };
        },

        logoutUser: async (
            _: unknown,
            args: { accessToken: string },
            context: { req: Request },
        ) => {
            const { accessToken } = args;
            const { ACCESS_TOKEN_SEED } = CONFIG;

            // verify that the access token is valid
            const verifyTokenResult = verifyJWTSafe({
                seed: ACCESS_TOKEN_SEED,
                token: accessToken,
            });
            if (verifyTokenResult.err) {
                return await handleErrorResult(
                    verifyTokenResult,
                    context.req,
                );
            }
            const verifiedTokenMaybe = verifyTokenResult.safeUnwrap();
            if (verifiedTokenMaybe.none) {
                return null;
            }
            // const verifiedToken = verifiedTokenMaybe.safeUnwrap();

            // decode token
            const decodedTokenResult = decodeJWTSafe(accessToken);
            if (decodedTokenResult.err) {
                return await handleErrorResult(
                    decodedTokenResult,
                    context.req,
                );
            }
            const decodedTokenMaybe = decodedTokenResult.safeUnwrap();
            if (decodedTokenMaybe.none) {
                return null;
            }
            const decodedToken = decodedTokenMaybe.safeUnwrap();
            const sessionId = decodedToken.sessionId.toString();

            // delete auth session
            const deleteAuthSessionResult = await deleteResourceByIdService(
                sessionId,
                AuthModel,
            );
            if (deleteAuthSessionResult.err) {
                return await handleErrorResult(
                    deleteAuthSessionResult,
                    context.req,
                );
            }
            const deletedAuthSessionMaybe = deleteAuthSessionResult
                .safeUnwrap();
            if (deletedAuthSessionMaybe.none) {
                return null;
            }

            const isDeleted = deletedAuthSessionMaybe.safeUnwrap();
            return isDeleted;
        },
    },
};

export { authResolvers };
