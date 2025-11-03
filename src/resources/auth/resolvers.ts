import type { Request } from "express";
import { HASH_SALT_ROUNDS } from "../../constants.ts";
import { getResourceByIdResolver } from "../../resolvers/index.ts";
import {
    createNewResourceService,
    getResourceByFieldService,
    updateResourceByIdService,
} from "../../services/index.ts";
import {
    handleCatchBlockError,
    handleErrorResult,
    hashStringSafe,
} from "../../utils.ts";
import { FileUploadModel, type FileUploadSchema } from "../fileUpload/model.ts";
import { UserModel, type UserSchema } from "../user/model.ts";
import { AuthModel } from "./model.ts";

const authResolvers = {
    Query: {
        getAuthSessionById: getResourceByIdResolver(AuthModel),

        checkUsernameExistsAtRegister: async (
            _: unknown,
            args: { username: string },
            context: { req: Request },
        ): Promise<boolean> => {
            try {
                const filter = args;
                const options = {};
                const projection = {};

                console.group(
                    "Checking if username exists at register:",
                    args.username,
                );

                const existingUserResult = await getResourceByFieldService({
                    model: AuthModel,
                    filter,
                    projection,
                    options,
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

        checkEmailExistsAtRegister: async (
            _: unknown,
            args: { email: string },
            context: { req: Request },
        ): Promise<boolean> => {
            try {
                const filter = args;
                const options = {};
                const projection = {};

                console.group(
                    "Checking if email exists at register:",
                    args.email,
                );

                const existingUserResult = await getResourceByFieldService({
                    model: AuthModel,
                    filter,
                    projection,
                    options,
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
            // Implementation in auth/mutations/loginUser.ts
        },

        logoutUser: async (
            _: unknown,
            args: { sessionId: string },
            context: { req: Request },
        ) => {
            // Implementation in auth/mutations/logoutUser.ts
        },
    },
};

export { authResolvers };
