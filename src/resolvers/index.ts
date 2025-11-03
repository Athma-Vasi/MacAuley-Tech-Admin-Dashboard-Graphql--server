import type { Request } from "express";
import type { GraphQLResolveInfo } from "graphql";
import type { Model } from "mongoose";
import { PROPERTY_DESCRIPTOR } from "../constants.ts";
import {
    createNewResourceService,
    deleteResourceByIdService,
    getAllResourcesService,
    getResourceByFieldService,
    getResourceByIdService,
    updateResourceByIdService,
} from "../services/index.ts";
import type { RecordDB } from "../types.ts";
import {
    getProjectionFromInfo,
    handleCatchBlockError,
    handleErrorResult,
    splitResourceIDFromArgs,
} from "../utils.ts";

/**
 * ══════════════════════════════════════════════════════════════
 * Query Handlers for GraphQL Resolvers
 * ══════════════════════════════════════════════════════════════
 */

function getAllResourcesResolver<
    Doc extends Record<PropertyKey, unknown> = RecordDB,
>(
    model: Model<Doc>,
) {
    return async function <
        Args extends Record<PropertyKey, unknown> = Record<
            PropertyKey,
            unknown
        >,
    >(
        _parent: unknown,
        args: Args,
        context: { req: Request },
        info: GraphQLResolveInfo,
    ) {
        try {
            const projection = getProjectionFromInfo(info);
            const filter = {};
            const options = {};

            console.group("Handling get all resources...");
            console.log(
                _parent,
                args,
                context,
                projection,
            );
            console.groupEnd();

            const resourcesResult = await getAllResourcesService({
                model,
                filter,
                options,
                projection,
            });
            if (resourcesResult.err) {
                return await handleErrorResult(
                    resourcesResult,
                    context.req,
                );
            }

            const resourcesMaybe = resourcesResult.safeUnwrap();
            if (resourcesMaybe.none) {
                console.warn("No resources found.");
                return null;
            }
            const resources = resourcesMaybe.safeUnwrap();

            return resources;
        } catch (error: unknown) {
            return await handleCatchBlockError(
                error,
                context.req,
            );
        }
    };
}

function getResourceByIdResolver<
    Doc extends Record<PropertyKey, unknown> = RecordDB,
>(
    model: Model<Doc>,
) {
    return async function <
        Args extends { _id: string } = {
            _id: string;
        },
    >(
        _parent: unknown,
        args: Args,
        context: { req: Request },
        info: GraphQLResolveInfo,
    ) {
        try {
            const projection = getProjectionFromInfo(info);

            console.group("Handling get resource by ID...");
            console.log(
                _parent,
                args,
                context,
                projection,
            );
            console.groupEnd();

            const resourceResult = await getResourceByIdService(
                args["_id"],
                model,
            );
            if (resourceResult.err) {
                return await handleErrorResult(
                    resourceResult,
                    context.req,
                );
            }

            const resourceMaybe = resourceResult.safeUnwrap();
            if (resourceMaybe.none) {
                console.warn("Resource not found with provided ID.");
                return null;
            }
            const resource = resourceMaybe.safeUnwrap();

            return Object.entries(resource).reduce(
                (partialResource, [key, value]) => {
                    if (projection[key] === 1) {
                        Object.defineProperty(partialResource, key, {
                            value: value,
                            ...PROPERTY_DESCRIPTOR,
                        });
                        return partialResource;
                    }

                    return partialResource;
                },
                Object.create(null),
            );
        } catch (error: unknown) {
            return await handleCatchBlockError(
                error,
                context.req,
            );
        }
    };
}

function getResourceByFieldResolver<
    Doc extends Record<PropertyKey, unknown> = RecordDB,
>(
    model: Model<Doc>,
) {
    return async function <
        Args extends Record<PropertyKey, unknown> = Record<
            PropertyKey,
            unknown
        >,
    >(
        _parent: unknown,
        args: Args,
        context: { req: Request },
        info: GraphQLResolveInfo,
    ) {
        try {
            const projection = getProjectionFromInfo(info);
            const filter = args;
            const options = {};

            console.group("Handling get resource by field...");
            console.log(
                _parent,
                args,
                context,
                projection,
            );
            console.groupEnd();

            const resourceResult = await getResourceByFieldService({
                model,
                filter,
                options,
                projection,
            });
            if (resourceResult.err) {
                return await handleErrorResult(
                    resourceResult,
                    context.req,
                );
            }

            const resourceMaybe = resourceResult.safeUnwrap();
            if (resourceMaybe.none) {
                console.warn("Resource not found with provided field.");
                return null;
            }
            const resource = resourceMaybe.safeUnwrap();

            return resource;
        } catch (error: unknown) {
            return await handleCatchBlockError(
                error,
                context.req,
            );
        }
    };
}

/**
 * ══════════════════════════════════════════════════════════════
 * Mutation Handlers for GraphQL Resolvers
 * ══════════════════════════════════════════════════════════════
 */

function createNewResourceResolver<
    Doc extends Record<PropertyKey, unknown> = RecordDB,
>(
    model: Model<Doc>,
) {
    return async function <
        Args extends Record<PropertyKey, unknown> = Record<
            PropertyKey,
            unknown
        >,
    >(
        _parent: unknown,
        args: Args,
        context: { req: Request },
        _info: GraphQLResolveInfo,
    ) {
        try {
            console.group("Handling create resource...");
            console.log(
                _parent,
                args,
                context,
            );
            console.groupEnd();

            const resourceResult = await createNewResourceService(
                args,
                model,
            );
            if (resourceResult.err) {
                return await handleErrorResult(
                    resourceResult,
                    context.req,
                );
            }

            const resourceMaybe = resourceResult.safeUnwrap();
            if (resourceMaybe.none) {
                console.error("Failed to create resource.");
                return null;
            }
            const resource = resourceMaybe.safeUnwrap();

            return resource;
        } catch (error: unknown) {
            return await handleCatchBlockError(
                error,
                context.req,
            );
        }
    };
}

function updateResourceByIdResolver<
    Doc extends Record<PropertyKey, unknown> = RecordDB,
>(
    model: Model<Doc>,
) {
    return async function <
        Args extends Partial<Record<PropertyKey, unknown>> & {
            _id: string;
        },
    >(
        _parent: unknown,
        args: Args,
        context: { req: Request },
        _info: GraphQLResolveInfo,
    ) {
        try {
            console.group("Handling update resource...");
            console.log(
                _parent,
                args,
                context,
            );
            console.groupEnd();

            const { resourceId, updateFields } = splitResourceIDFromArgs(
                args,
            );
            const resourceResult = await updateResourceByIdService({
                resourceId,
                updateFields,
                model,
                updateOperator: "$set",
            });
            if (resourceResult.err) {
                return await handleErrorResult(
                    resourceResult,
                    context.req,
                );
            }

            const resourceMaybe = resourceResult.safeUnwrap();
            if (resourceMaybe.none) {
                console.error("Failed to update resource.");
                return null;
            }
            const resource = resourceMaybe.safeUnwrap();

            return resource;
        } catch (error: unknown) {
            return await handleCatchBlockError(
                error,
                context.req,
            );
        }
    };
}

function deleteResourceByIdResolver<
    Doc extends Record<PropertyKey, unknown> = RecordDB,
>(
    model: Model<Doc>,
) {
    return async function <
        Args extends { _id: string } = {
            _id: string;
        },
    >(
        _parent: unknown,
        args: Args,
        context: { req: Request },
        _info: GraphQLResolveInfo,
    ) {
        try {
            console.group("Handling delete resource...");
            console.log(
                _parent,
                args,
                context,
            );
            console.groupEnd();

            const deleteResult = await deleteResourceByIdService(
                args._id,
                model,
            );
            if (deleteResult.err) {
                return await handleErrorResult(
                    deleteResult,
                    context.req,
                );
            }

            const deleteMaybe = deleteResult.safeUnwrap();
            if (deleteMaybe.none) {
                console.error("Failed to delete resource.");
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
    };
}

export {
    createNewResourceResolver,
    deleteResourceByIdResolver,
    getAllResourcesResolver,
    getResourceByFieldResolver,
    getResourceByIdResolver,
    updateResourceByIdResolver,
};
