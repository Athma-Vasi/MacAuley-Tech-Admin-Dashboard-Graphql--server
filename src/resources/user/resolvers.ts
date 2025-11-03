import {
    createNewResourceHandler,
    deleteResourceByIdHandler,
    getAllResourcesHandler,
    getResourceByFieldHandler,
    getResourceByIdHandler,
    updateResourceByIdHandler,
} from "../../handlers/index.ts";
import { UserModel } from "./model.ts";

const userResolvers = {
    Query: {
        getUserByID: getResourceByIdHandler(UserModel),
        getUserByUsername: getResourceByFieldHandler(UserModel),
        getUsers: getAllResourcesHandler(UserModel),
    },

    Mutation: {
        createUser: createNewResourceHandler(UserModel),
        updateUserById: updateResourceByIdHandler(UserModel),
        deleteUserById: deleteResourceByIdHandler(UserModel),
    },
};

export { userResolvers };
