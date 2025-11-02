import type { Request } from "express";
import type { GraphQLResolveInfo } from "graphql";
import {
    createNewResourceService,
    deleteResourceByIdService,
    getResourceByFieldService,
    updateResourceByIdService,
} from "../../services/index.ts";
import {
    getProjectionFromInfo,
    handleCatchBlockError,
    handleErrorResult,
    splitResourceIDFromArgs,
} from "../../utils.ts";
import { UserModel, type UserSchema } from "./model.ts";

const userResolvers = {
    Query: {
        getUserByID: async (
            _parent: unknown,
            args: Record<string, unknown>,
            context: { req: Request },
            info: GraphQLResolveInfo,
        ) => {
            try {
                const projection = getProjectionFromInfo(info);
                const filter = { _id: args["id"] };
                const options = {};

                console.group("Fetching user by ID...");
                console.log(
                    _parent,
                    args,
                    context,
                    projection,
                );
                console.groupEnd();

                const userResult = await getResourceByFieldService({
                    model: UserModel,
                    filter,
                    options,
                    projection,
                });
                if (userResult.err) {
                    return await handleErrorResult(
                        userResult,
                        context.req,
                    );
                }

                const userMaybe = userResult.safeUnwrap();
                if (userMaybe.none) {
                    console.warn("User not found with provided ID.");
                    return null;
                }
                const user = userMaybe.safeUnwrap();

                return user;
            } catch (error: unknown) {
                return await handleCatchBlockError(
                    error,
                    context.req,
                );
            }
        },

        getUserByUsername: async (
            _parent: unknown,
            args: Record<string, unknown>,
            context: { req: Request },
            info: GraphQLResolveInfo,
        ) => {
            try {
                const projection = getProjectionFromInfo(info);
                const filter = args;
                const options = {};

                console.group("Fetching user...");
                console.log(
                    _parent,
                    args,
                    context,
                    projection,
                );
                console.groupEnd();

                const userResult = await getResourceByFieldService({
                    model: UserModel,
                    filter,
                    options,
                    projection,
                });
                if (userResult.err) {
                    return await handleErrorResult(
                        userResult,
                        context.req,
                    );
                }

                const userMaybe = userResult.safeUnwrap();
                if (userMaybe.none) {
                    console.warn("User not found with provided username.");
                    return null;
                }
                const user = userMaybe.safeUnwrap();

                return user;
            } catch (error: unknown) {
                return await handleCatchBlockError(
                    error,
                    context.req,
                );
            }
        },

        getUsers: async (
            _parent: unknown,
            args: Record<string, unknown>,
            context: { req: Request },
            info: GraphQLResolveInfo,
        ) => {
            try {
                const filter = {};
                const options = {};
                const projection = getProjectionFromInfo(info);

                console.group("Fetching all users...");
                console.log(_parent, args, context, projection);
                console.groupEnd();

                const usersResult = await getResourceByFieldService({
                    model: UserModel,
                    filter,
                    options,
                    projection,
                });
                if (usersResult.err) {
                    return await handleErrorResult(
                        usersResult,
                        context.req,
                    );
                }

                const usersMaybe = usersResult.safeUnwrap();
                if (usersMaybe.none) {
                    console.warn("No users found.");
                    return null;
                }
                const users = usersMaybe.safeUnwrap();

                return users;
            } catch (error: unknown) {
                return await handleCatchBlockError(
                    error,
                    context.req,
                );
            }
        },
    },

    Mutation: {
        createUser: async (
            _parent: unknown,
            args: Partial<UserSchema>,
            context: { req: Request },
            _info: GraphQLResolveInfo,
        ) => {
            try {
                console.group("Creating new user...");
                console.log(_parent, args, context);
                console.groupEnd();

                const newUserResult = await createNewResourceService(
                    args,
                    UserModel,
                );
                if (newUserResult.err) {
                    return await handleErrorResult(
                        newUserResult,
                        context.req,
                    );
                }

                const newUserMaybe = newUserResult.safeUnwrap();
                if (newUserMaybe.none) {
                    console.error("Failed to create user.");
                    return null;
                }
                const newUser = newUserMaybe.safeUnwrap();

                return newUser;
            } catch (error: unknown) {
                return await handleCatchBlockError(
                    error,
                    context.req,
                );
            }
        },

        deleteUser: async (
            _parent: unknown,
            args: { _id: string },
            context: { req: Request },
            _info: GraphQLResolveInfo,
        ) => {
            try {
                console.group("Deleting user...");
                console.log(_parent, args, context);
                console.groupEnd();

                const deleteResult = await deleteResourceByIdService(
                    args["_id"],
                    UserModel,
                );
                if (deleteResult.err) {
                    return await handleErrorResult(
                        deleteResult,
                        context.req,
                    );
                }

                const deleteMaybe = deleteResult.safeUnwrap();
                if (deleteMaybe.none) {
                    console.error("Failed to delete user.");
                    return null;
                }

                return deleteMaybe.safeUnwrap();
            } catch (error: unknown) {
                return await handleCatchBlockError(
                    error,
                    context.req,
                );
            }
        },

        updateUser: async (
            _parent: unknown,
            args: { _id: string } & Partial<UserSchema>,
            context: { req: Request },
            _info: GraphQLResolveInfo,
        ) => {
            try {
                console.group("Updating user...");
                console.log(_parent, args, context);
                console.groupEnd();

                const { resourceId, updateFields } = splitResourceIDFromArgs(
                    args,
                );

                const updateResult = await updateResourceByIdService({
                    resourceId,
                    updateFields,
                    model: UserModel,
                    updateOperator: "$set",
                });
                if (updateResult.err) {
                    return await handleErrorResult(
                        updateResult,
                        context.req,
                    );
                }

                const updatedUserMaybe = updateResult.safeUnwrap();
                if (updatedUserMaybe.none) {
                    console.error("Failed to update user.");
                    return null;
                }
                const updatedUser = updatedUserMaybe.safeUnwrap();

                return updatedUser;
            } catch (error: unknown) {
                return await handleCatchBlockError(
                    error,
                    context.req,
                );
            }
        },
    },
};

export { userResolvers };
