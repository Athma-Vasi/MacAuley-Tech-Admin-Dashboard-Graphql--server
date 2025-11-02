import type { GraphQLResolveInfo } from "graphql";
import { PROPERTY_DESCRIPTOR } from "../../constants.ts";
import {
    createNewResourceService,
    deleteResourceByIdService,
    getResourceByFieldService,
    updateResourceByIdService,
} from "../../services/index.ts";
import { getProjectionFromInfo } from "../../utils.ts";
import { UserModel, type UserSchema } from "./model.ts";

const userResolvers = {
    Query: {
        getUserByID: async (
            _parent: unknown,
            args: Record<string, unknown>,
            context: unknown,
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
                    console.error(
                        "Error fetching user by ID:",
                        userResult.mapErr((e) => e),
                    );
                    return;
                }

                const userMaybe = userResult.safeUnwrap();
                if (userMaybe.none) {
                    console.warn("User not found with provided ID.");
                    return;
                }
                const user = userMaybe.safeUnwrap();

                return user;
            } catch (error: unknown) {
                console.error("Unexpected error:", error);
                return null;
            }
        },

        getUserByUsername: async (
            _parent: unknown,
            args: Record<string, unknown>,
            context: unknown,
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
                    console.error(
                        "Error fetching user:",
                        userResult.mapErr((e) => e),
                    );
                    return;
                }

                const userMaybe = userResult.safeUnwrap();
                if (userMaybe.none) {
                    console.warn("User not found with provided username.");
                    return;
                }
                const user = userMaybe.safeUnwrap();

                return user;
            } catch (error: unknown) {
                console.error("Unexpected error:", error);
                return null;
            }
        },

        getUsers: async (
            _parent: unknown,
            args: Record<string, unknown>,
            context: unknown,
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
                    console.error(
                        "Error fetching users:",
                        usersResult.mapErr((e) => e),
                    );
                    return [];
                }

                const usersMaybe = usersResult.safeUnwrap();
                if (usersMaybe.none) {
                    console.warn("No users found.");
                    return [];
                }
                const users = usersMaybe.safeUnwrap();

                return users;
            } catch (error: unknown) {
                console.error("Unexpected error:", error);
                return [];
            }
        },
    },

    Mutation: {
        createUser: async (
            _parent: unknown,
            args: Partial<UserSchema>,
            context: unknown,
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
                    console.error(
                        "Error creating user:",
                        newUserResult.mapErr((e) => e),
                    );
                    return null;
                }

                const newUserMaybe = newUserResult.safeUnwrap();
                if (newUserMaybe.none) {
                    console.error("Failed to create user.");
                    return null;
                }
                const newUser = newUserMaybe.safeUnwrap();

                return newUser;
            } catch (error: unknown) {
                console.error("Error creating user:", error);
                return null;
            }
        },

        deleteUser: async (
            _parent: unknown,
            args: { id: string },
            context: unknown,
            _info: GraphQLResolveInfo,
        ) => {
            try {
                console.group("Deleting user...");
                console.log(_parent, args, context);
                console.groupEnd();

                const userId = args["id"];
                const deleteResult = await deleteResourceByIdService(
                    userId,
                    UserModel,
                );
                if (deleteResult.err) {
                    console.error(
                        "Error deleting user:",
                        deleteResult.mapErr((e) => e),
                    );
                    return false;
                }

                const deleteMaybe = deleteResult.safeUnwrap();
                if (deleteMaybe.none) {
                    console.error("Failed to delete user.");
                    return false;
                }

                return deleteMaybe.safeUnwrap();
            } catch (error: unknown) {
                console.error("Error deleting user:", error);
                return false;
            }
        },

        updateUser: async (
            _parent: unknown,
            args: { _id: string } & Partial<Omit<UserSchema, "_id">>,
            context: unknown,
            _info: GraphQLResolveInfo,
        ) => {
            try {
                console.group("Updating user...");
                console.log(_parent, args, context);
                console.groupEnd();

                const { resourceId, updateFields } = Object.entries(args)
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
                            updateFields: {} as Record<string, unknown>,
                        },
                    );

                const updateResult = await updateResourceByIdService({
                    resourceId,
                    fields: updateFields,
                    model: UserModel,
                    updateOperator: "$set",
                });
                if (updateResult.err) {
                    console.error(
                        "Error updating user:",
                        updateResult.mapErr((e) => e),
                    );
                    return null;
                }

                const updatedUserMaybe = updateResult.safeUnwrap();
                if (updatedUserMaybe.none) {
                    console.error("Failed to update user.");
                    return null;
                }
                const updatedUser = updatedUserMaybe.safeUnwrap();

                return updatedUser;
            } catch (error: unknown) {
                console.error("Error updating user:", error);
                return null;
            }
        },
    },
};

export { userResolvers };
