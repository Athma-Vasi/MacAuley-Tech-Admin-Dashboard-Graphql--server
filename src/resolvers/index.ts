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
import type { RecordDB, ServerResponseGraphQL } from "../types.ts";
import {
    createServerErrorResponse,
    createServerSuccessResponse,
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
    Resource extends Record<PropertyKey, unknown> = RecordDB,
>(
    model: Model<Resource>,
) {
    return async function <
        Arguments extends Record<PropertyKey, unknown> = Record<
            PropertyKey,
            unknown
        >,
    >(
        _parent: unknown,
        args: Arguments,
        context: { request: Request },
        info: GraphQLResolveInfo,
    ): Promise<ServerResponseGraphQL<NonNullable<Partial<Resource>>>> {
        try {
            const { request } = context;
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
                try {
                    return await handleErrorResult(
                        resourcesResult,
                        request,
                    );
                } catch (_error: unknown) {
                    return createServerErrorResponse({
                        request,
                        statusCode: 500,
                    });
                }
            }
            const resourcesMaybe = resourcesResult.safeUnwrap();
            if (resourcesMaybe.none) {
                return createServerErrorResponse({
                    request,
                    statusCode: 404,
                });
            }
            const resources = resourcesMaybe.safeUnwrap();

            return createServerSuccessResponse({
                request,
                dataBox: resources,
            });
        } catch (error: unknown) {
            try {
                return await handleCatchBlockError(
                    error,
                    context.request,
                );
            } catch (_error: unknown) {
                return createServerErrorResponse({
                    request: context.request,
                    statusCode: 500,
                });
            }
        }
    };
}

function getResourceByIdResolver<
    Resource extends Record<PropertyKey, unknown> = RecordDB,
>(
    model: Model<Resource>,
) {
    return async function <
        Arguments extends { _id: string } = {
            _id: string;
        },
    >(
        _parent: unknown,
        args: Arguments,
        context: { request: Request },
        info: GraphQLResolveInfo,
    ): Promise<ServerResponseGraphQL<NonNullable<Partial<Resource>>>> {
        try {
            const { request } = context;
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
                try {
                    return await handleErrorResult(
                        resourceResult,
                        request,
                    );
                } catch (_error: unknown) {
                    return createServerErrorResponse({
                        request,
                        statusCode: 500,
                    });
                }
            }
            const resourceMaybe = resourceResult.safeUnwrap();
            if (resourceMaybe.none) {
                return createServerErrorResponse({
                    request,
                    statusCode: 404,
                });
            }
            const resource = resourceMaybe.safeUnwrap();

            // create a new object containing only the fields specified in the GraphQL projection
            const partialResource = Object.entries(resource).reduce<
                NonNullable<Resource>
            >(
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

            return createServerSuccessResponse({
                request,
                dataBox: [partialResource],
            });
        } catch (error: unknown) {
            try {
                return await handleCatchBlockError(
                    error,
                    context.request,
                );
            } catch (_error: unknown) {
                return createServerErrorResponse({
                    request: context.request,
                    statusCode: 500,
                });
            }
        }
    };
}

function getResourceByFieldResolver<
    Resource extends Record<PropertyKey, unknown> = RecordDB,
>(
    model: Model<Resource>,
) {
    return async function <
        Arguments extends Record<PropertyKey, unknown> = Record<
            PropertyKey,
            unknown
        >,
    >(
        _parent: unknown,
        args: Arguments,
        context: { request: Request },
        info: GraphQLResolveInfo,
    ): Promise<ServerResponseGraphQL<NonNullable<Partial<Resource>>>> {
        try {
            const { request } = context;
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
                try {
                    return await handleErrorResult(
                        resourceResult,
                        request,
                    );
                } catch (_error: unknown) {
                    return createServerErrorResponse({
                        request,
                        statusCode: 500,
                    });
                }
            }
            const resourceMaybe = resourceResult.safeUnwrap();
            if (resourceMaybe.none) {
                return createServerErrorResponse({
                    request,
                    statusCode: 404,
                });
            }
            const resource = resourceMaybe.safeUnwrap();

            return createServerSuccessResponse({
                request,
                dataBox: [resource],
            });
        } catch (error: unknown) {
            try {
                return await handleCatchBlockError(
                    error,
                    context.request,
                );
            } catch (_error: unknown) {
                return createServerErrorResponse({
                    request: context.request,
                    statusCode: 500,
                });
            }
        }
    };
}

/**
 * ══════════════════════════════════════════════════════════════
 * Mutation Handlers for GraphQL Resolvers
 * ══════════════════════════════════════════════════════════════
 */

function createNewResourceResolver<
    Resource extends Record<PropertyKey, unknown> = RecordDB,
>(
    model: Model<Resource>,
) {
    return async function <
        Arguments extends Record<PropertyKey, unknown> = Record<
            PropertyKey,
            unknown
        >,
    >(
        _parent: unknown,
        args: Arguments,
        context: { request: Request },
        _info: GraphQLResolveInfo,
    ): Promise<ServerResponseGraphQL<NonNullable<Resource>>> {
        try {
            const { request } = context;
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
                try {
                    return await handleErrorResult(
                        resourceResult,
                        request,
                    );
                } catch (_error: unknown) {
                    return createServerErrorResponse({
                        request,
                        statusCode: 500,
                    });
                }
            }
            const resourceMaybe = resourceResult.safeUnwrap();
            if (resourceMaybe.none) {
                return createServerErrorResponse({
                    request,
                    statusCode: 500,
                });
            }
            const resource = resourceMaybe.safeUnwrap();

            return createServerSuccessResponse({
                request,
                dataBox: [resource],
            });
        } catch (error: unknown) {
            try {
                return await handleCatchBlockError(
                    error,
                    context.request,
                );
            } catch (_error: unknown) {
                return createServerErrorResponse({
                    request: context.request,
                    statusCode: 500,
                });
            }
        }
    };
}

function updateResourceByIdResolver<
    Resource extends Record<PropertyKey, unknown> = RecordDB,
>(
    model: Model<Resource>,
) {
    return async function <
        Arguments extends Partial<Record<PropertyKey, unknown>> & {
            _id: string;
        },
    >(
        _parent: unknown,
        args: Arguments,
        context: { request: Request },
        _info: GraphQLResolveInfo,
    ): Promise<ServerResponseGraphQL<NonNullable<Resource>>> {
        try {
            const { request } = context;
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
                try {
                    return await handleErrorResult(
                        resourceResult,
                        request,
                    );
                } catch (_error: unknown) {
                    return createServerErrorResponse({
                        request,
                        statusCode: 500,
                    });
                }
            }
            const resourceMaybe = resourceResult.safeUnwrap();
            if (resourceMaybe.none) {
                return createServerErrorResponse({
                    request,
                    statusCode: 404,
                });
            }
            const resource = resourceMaybe.safeUnwrap();

            return createServerSuccessResponse({
                request,
                dataBox: [resource],
            });
        } catch (error: unknown) {
            try {
                return await handleCatchBlockError(
                    error,
                    context.request,
                );
            } catch (_error: unknown) {
                return createServerErrorResponse({
                    request: context.request,
                    statusCode: 500,
                });
            }
        }
    };
}

function deleteResourceByIdResolver<
    Resource extends Record<PropertyKey, unknown> = RecordDB,
>(
    model: Model<Resource>,
) {
    return async function <
        Arguments extends { _id: string } = {
            _id: string;
        },
    >(
        _parent: unknown,
        args: Arguments,
        context: { request: Request },
        _info: GraphQLResolveInfo,
    ): Promise<ServerResponseGraphQL<boolean>> {
        try {
            const { request } = context;
            console.group("Handling delete resource...");
            console.log(
                _parent,
                args,
                context,
            );
            console.groupEnd();

            const deleteResult = await deleteResourceByIdService(
                args["_id"],
                model,
            );
            if (deleteResult.err) {
                try {
                    return await handleErrorResult(
                        deleteResult,
                        request,
                    );
                } catch (_error: unknown) {
                    return createServerErrorResponse({
                        request,
                        statusCode: 500,
                    });
                }
            }
            const deleteMaybe = deleteResult.safeUnwrap();
            if (deleteMaybe.none) {
                return createServerErrorResponse({
                    request,
                    statusCode: 404,
                });
            }
            const deleteSuccess = deleteMaybe.safeUnwrap();

            return createServerSuccessResponse({
                request,
                dataBox: [deleteSuccess],
            });
        } catch (error: unknown) {
            try {
                return await handleCatchBlockError(
                    error,
                    context.request,
                );
            } catch (_error: unknown) {
                return createServerErrorResponse({
                    request: context.request,
                    statusCode: 500,
                });
            }
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
