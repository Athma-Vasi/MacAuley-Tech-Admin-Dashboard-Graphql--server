import {
    createNewResourceResolver,
    deleteResourceByIdResolver,
    getAllResourcesResolver,
    getResourceByFieldResolver,
    getResourceByIdResolver,
    updateResourceByIdResolver,
} from "../../resolvers/index.ts";
import { ErrorLogModel } from "./model.ts";

const errorLogResolvers = {
    Query: {
        getAllErrorLogs: getAllResourcesResolver(ErrorLogModel),
        getErrorLogById: getResourceByIdResolver(ErrorLogModel),
        getErrorLogByField: getResourceByFieldResolver(ErrorLogModel),
    },

    Mutation: {
        createErrorLog: createNewResourceResolver(ErrorLogModel),
        updateErrorLogById: updateResourceByIdResolver(ErrorLogModel),
        deleteErrorLogById: deleteResourceByIdResolver(ErrorLogModel),
    },
};

export { errorLogResolvers };
