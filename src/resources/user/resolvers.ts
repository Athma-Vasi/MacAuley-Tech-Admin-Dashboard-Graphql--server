const userResolvers = {
    Query: {
        getUser: async (
            _: unknown,
            __: Record<string, unknown>,
            ___: unknown,
        ) => {
            return await "User";
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
