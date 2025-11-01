import type { GraphQLResolveInfo } from "graphql";
import { getProjectionFromInfo } from "../../utils.ts";

const userResolvers = {
    Query: {
        getUserByID: async (
            _: unknown,
            __: Record<string, unknown>,
            ___: unknown,
        ) => {
            return await "Fetched User";
        },

        getUserByUsername: async (
            _: unknown,
            args: Record<string, unknown>,
            context: unknown,
            info: GraphQLResolveInfo,
        ) => {
            console.group("Fetching user...");
            console.log(
                _,
                args,
                context,
                getProjectionFromInfo(info),
            );
            console.groupEnd();

            return {
                firstName: "Alexei",
                lastName: "MacAuley",
            };
        },

        getUsers: async (
            _: unknown,
            __: Record<string, unknown>,
            ___: unknown,
        ) => {
            return await ["User1", "User2"];
        },
    },

    Mutation: {
        createUser: async (
            _: unknown,
            __: Record<string, unknown>,
            ___: unknown,
        ) => {
            return await "Created User";
        },

        deleteUser: async (
            _: unknown,
            __: Record<string, unknown>,
            ___: unknown,
        ) => {
            return await true;
        },

        updateUser: async (
            _: unknown,
            __: Record<string, unknown>,
            ___: unknown,
        ) => {
            return await "Updated User";
        },
    },
};

export { userResolvers };
