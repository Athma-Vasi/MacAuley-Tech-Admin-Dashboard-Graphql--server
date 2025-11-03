import {
    createNewResourceResolver,
    deleteResourceByIdResolver,
    getAllResourcesResolver,
    getResourceByIdResolver,
} from "../../resolvers/index.ts";
import { FileUploadModel } from "./model.ts";

const fileUploadResolvers = {
    Query: {
        getFileUploadById: getResourceByIdResolver(FileUploadModel),
        getAllFileUploads: getAllResourcesResolver(FileUploadModel),
    },
    Mutation: {
        uploadFile: createNewResourceResolver(FileUploadModel),
        deleteFileUploadById: deleteResourceByIdResolver(FileUploadModel),
    },
};

export { fileUploadResolvers };
