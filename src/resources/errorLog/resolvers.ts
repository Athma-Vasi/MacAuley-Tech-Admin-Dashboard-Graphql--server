import type { Request } from "express";
import type { GraphQLResolveInfo } from "graphql";
import {
    createNewResourceService,
    deleteResourceByIdService,
    getAllResourcesService,
    getResourceByFieldService,
    updateResourceByIdService,
} from "../../services/index.ts";
import {
    getProjectionFromInfo,
    handleCatchBlockError,
    handleErrorResult,
    splitResourceIDFromArgs,
} from "../../utils.ts";
import { ErrorLogModel, type ErrorLogSchema } from "./model.ts";

const errorLogResolvers = {
    Query: {
        getErrorLogs: async (
            _parent: unknown,
            args: Record<string, unknown>,
            context: { req: Request },
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
                    return await handleErrorResult(
                        errorLogsResult,
                        context.req,
                    );
                }

                const errorLogsMaybe = errorLogsResult.safeUnwrap();
                if (errorLogsMaybe.none) {
                    console.warn("No error logs found.");
                    return null;
                }
                const errorLogs = errorLogsMaybe.safeUnwrap();

                return errorLogs;
            } catch (error: unknown) {
                return await handleCatchBlockError(
                    error,
                    context.req,
                );
            }
        },

        getErrorLogByID: async (
            _parent: unknown,
            args: { _id: string } & Partial<ErrorLogSchema>,
            context: { req: Request },
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
                    return await handleErrorResult(
                        errorLogResult,
                        context.req,
                    );
                }

                const errorLogMaybe = errorLogResult.safeUnwrap();
                if (errorLogMaybe.none) {
                    console.warn("Error log not found with provided ID.");
                    return null;
                }
                const errorLog = errorLogMaybe.safeUnwrap();

                return errorLog;
            } catch (error: unknown) {
                return await handleCatchBlockError(
                    error,
                    context.req,
                );
            }
        },

        getErrorLogByField: async (
            _parent: unknown,
            args: Partial<ErrorLogSchema>,
            context: { req: Request },
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
                    return await handleErrorResult(
                        errorLogResult,
                        context.req,
                    );
                }

                const errorLogMaybe = errorLogResult.safeUnwrap();
                if (errorLogMaybe.none) {
                    console.warn("Error log not found with provided field.");
                    return null;
                }
                const errorLog = errorLogMaybe.safeUnwrap();

                return errorLog;
            } catch (error: unknown) {
                return await handleCatchBlockError(
                    error,
                    context.req,
                );
            }
        },
    },

    Mutation: {
        createErrorLog: async (
            _parent: unknown,
            args: ErrorLogSchema,
            context: { req: Request },
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
                    return await handleErrorResult(
                        errorLogResult,
                        context.req,
                    );
                }

                const errorLogMaybe = errorLogResult.safeUnwrap();
                if (errorLogMaybe.none) {
                    console.error("Failed to create error log.");
                    return null;
                }
                const errorLog = errorLogMaybe.safeUnwrap();

                return errorLog;
            } catch (error: unknown) {
                return await handleCatchBlockError(
                    error,
                    context.req,
                );
            }
        },

        updateErrorLog: async (
            _parent: unknown,
            args: Partial<ErrorLogSchema> & { _id: string },
            context: { req: Request },
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
                    updateFields,
                    model: ErrorLogModel,
                    updateOperator: "$set",
                });
                if (errorLogResult.err) {
                    return await handleErrorResult(
                        errorLogResult,
                        context.req,
                    );
                }

                const errorLogMaybe = errorLogResult.safeUnwrap();
                if (errorLogMaybe.none) {
                    console.error("Failed to update error log.");
                    return null;
                }
                const errorLog = errorLogMaybe.safeUnwrap();

                return errorLog;
            } catch (error: unknown) {
                return await handleCatchBlockError(
                    error,
                    context.req,
                );
            }
        },

        deleteErrorLog: async (
            _parent: unknown,
            args: { _id: string },
            context: { req: Request },
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
                    return await handleErrorResult(
                        deleteResult,
                        context.req,
                    );
                }

                const deleteMaybe = deleteResult.safeUnwrap();
                if (deleteMaybe.none) {
                    console.error("Failed to delete error log.");
                    return null;
                }
                const deleteSuccess = deleteMaybe.safeUnwrap();

                return deleteSuccess;
            } catch (error: unknown) {
                return await handleCatchBlockError(
                    error,
                    context.req,
                );
            }
        },
    },
};

export { errorLogResolvers };
