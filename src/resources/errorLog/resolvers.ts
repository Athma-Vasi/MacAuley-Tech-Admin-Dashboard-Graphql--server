import type { GraphQLResolveInfo } from "graphql";
import {
    createNewResourceService,
    deleteResourceByIdService,
    getAllResourcesService,
    getResourceByFieldService,
    updateResourceByIdService,
} from "../../services/index.ts";
import { getProjectionFromInfo, splitResourceIDFromArgs } from "../../utils.ts";
import { ErrorLogModel, type ErrorLogSchema } from "./model.ts";

const errorLogResolvers = {
    Query: {
        getErrorLogs: async (
            _parent: unknown,
            args: Record<string, unknown>,
            context: unknown,
            info: GraphQLResolveInfo,
        ) => {
            try {
                const projection = getProjectionFromInfo(info);
                const filter = {};
                const options = {};

                console.group("Fetching all error logs...");
                console.log(
                    _parent,
                    args,
                    context,
                    projection,
                );
                console.groupEnd();

                const errorLogsResult = await getAllResourcesService({
                    model: ErrorLogModel,
                    filter,
                    options,
                    projection,
                });
                if (errorLogsResult.err) {
                    console.error(
                        "Error fetching all error logs:",
                        errorLogsResult.mapErr((e) => e),
                    );
                    return null;
                }

                const errorLogsMaybe = errorLogsResult.safeUnwrap();
                if (errorLogsMaybe.none) {
                    console.warn("No error logs found.");
                    return null;
                }
                const errorLogs = errorLogsMaybe.safeUnwrap();

                return errorLogs;
            } catch (error: unknown) {
                console.error("Unexpected error:", error);
                return null;
            }
        },

        getErrorLogByID: async (
            _parent: unknown,
            args: { _id: string } & Partial<ErrorLogSchema>,
            context: unknown,
            info: GraphQLResolveInfo,
        ) => {
            try {
                const projection = getProjectionFromInfo(info);
                const filter = { _id: args["_id"] };
                const options = {};

                console.group("Fetching error log by ID...");
                console.log(
                    _parent,
                    args,
                    context,
                    projection,
                );
                console.groupEnd();

                const errorLogResult = await getResourceByFieldService({
                    model: ErrorLogModel,
                    filter,
                    options,
                    projection,
                });
                if (errorLogResult.err) {
                    console.error(
                        "Error fetching error log by ID:",
                        errorLogResult.mapErr((e) => e),
                    );
                    return null;
                }

                const errorLogMaybe = errorLogResult.safeUnwrap();
                if (errorLogMaybe.none) {
                    console.warn("Error log not found with provided ID.");
                    return null;
                }
                const errorLog = errorLogMaybe.safeUnwrap();

                return errorLog;
            } catch (error: unknown) {
                console.error("Unexpected error:", error);
                return null;
            }
        },

        getErrorLogByField: async (
            _parent: unknown,
            args: Partial<ErrorLogSchema>,
            context: unknown,
            info: GraphQLResolveInfo,
        ) => {
            try {
                const projection = getProjectionFromInfo(info);
                const filter = args;
                const options = {};

                console.group("Fetching error log by field...");
                console.log(
                    _parent,
                    args,
                    context,
                    projection,
                );
                console.groupEnd();

                const errorLogResult = await getResourceByFieldService({
                    model: ErrorLogModel,
                    filter,
                    options,
                    projection,
                });
                if (errorLogResult.err) {
                    console.error(
                        "Error fetching error log by field:",
                        errorLogResult.mapErr((e) => e),
                    );
                    return null;
                }

                const errorLogMaybe = errorLogResult.safeUnwrap();
                if (errorLogMaybe.none) {
                    console.warn("Error log not found with provided field.");
                    return null;
                }
                const errorLog = errorLogMaybe.safeUnwrap();

                return errorLog;
            } catch (error: unknown) {
                console.error("Unexpected error:", error);
                return null;
            }
        },
    },

    Mutation: {
        createErrorLog: async (
            _parent: unknown,
            args: ErrorLogSchema,
            context: unknown,
            _info: GraphQLResolveInfo,
        ) => {
            try {
                console.group("Creating new error log...");
                console.log(
                    _parent,
                    args,
                    context,
                );
                console.groupEnd();

                const errorLogResult = await createNewResourceService(
                    args,
                    ErrorLogModel,
                );
                if (errorLogResult.err) {
                    console.error(
                        "Error creating error log:",
                        errorLogResult.mapErr((e) => e),
                    );
                    return null;
                }

                const errorLogMaybe = errorLogResult.safeUnwrap();
                if (errorLogMaybe.none) {
                    console.error("Failed to create error log.");
                    return null;
                }
                const errorLog = errorLogMaybe.safeUnwrap();

                return errorLog;
            } catch (error: unknown) {
                console.error("Unexpected error:", error);
                return null;
            }
        },

        updateErrorLog: async (
            _parent: unknown,
            args: Partial<ErrorLogSchema> & { _id: string },
            context: unknown,
            _info: GraphQLResolveInfo,
        ) => {
            try {
                console.group("Updating error log...");
                console.log(
                    _parent,
                    args,
                    context,
                );
                console.groupEnd();

                const { resourceId, updateFields } = splitResourceIDFromArgs(
                    args,
                );
                const errorLogResult = await updateResourceByIdService({
                    resourceId,
                    fields: updateFields,
                    model: ErrorLogModel,
                    updateOperator: "$set",
                });
                if (errorLogResult.err) {
                    console.error(
                        "Error updating error log:",
                        errorLogResult.mapErr((e) => e),
                    );
                    return null;
                }

                const errorLogMaybe = errorLogResult.safeUnwrap();
                if (errorLogMaybe.none) {
                    console.error("Failed to update error log.");
                    return null;
                }
                const errorLog = errorLogMaybe.safeUnwrap();

                return errorLog;
            } catch (error: unknown) {
                console.error("Unexpected error:", error);
                return null;
            }
        },

        deleteErrorLog: async (
            _parent: unknown,
            args: { _id: string },
            context: unknown,
            _info: GraphQLResolveInfo,
        ) => {
            try {
                console.group("Deleting error log...");
                console.log(
                    _parent,
                    args,
                    context,
                );
                console.groupEnd();

                const deleteResult = await deleteResourceByIdService(
                    args._id,
                    ErrorLogModel,
                );
                if (deleteResult.err) {
                    console.error(
                        "Error deleting error log:",
                        deleteResult.mapErr((e) => e),
                    );
                    return null;
                }

                const deleteMaybe = deleteResult.safeUnwrap();
                if (deleteMaybe.none) {
                    console.error("Failed to delete error log.");
                    return null;
                }
                const deleteSuccess = deleteMaybe.safeUnwrap();

                return deleteSuccess;
            } catch (error: unknown) {
                console.error("Unexpected error:", error);
                return null;
            }
        },
    },
};

export { errorLogResolvers };
