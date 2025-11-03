import {
    createNewResourceResolver,
    deleteResourceByIdResolver,
    getAllResourcesResolver,
    getResourceByFieldResolver,
    getResourceByIdResolver,
    updateResourceByIdResolver,
} from "../../resolvers/index.ts";
import { UserModel } from "./model.ts";

const userResolvers = {
    Query: {
        getUserByID: getResourceByIdResolver(UserModel),
        getUserByUsername: getResourceByFieldResolver(UserModel),
        getUsers: getAllResourcesResolver(UserModel),
    },

    Mutation: {
        createUser: createNewResourceResolver(UserModel),
        updateUserById: updateResourceByIdResolver(UserModel),
        deleteUserById: deleteResourceByIdResolver(UserModel),
    },
};

export { userResolvers };
