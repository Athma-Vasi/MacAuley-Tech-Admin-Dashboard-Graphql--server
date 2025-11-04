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
    splitResourceIDFromArgs,
    unwrapResultAndOption,
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
        context: { req: Request },
        info: GraphQLResolveInfo,
    ): Promise<Array<Partial<Resource>> | null> {
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
            const resources = await unwrapResultAndOption(
                resourcesResult,
                context.req,
            );

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
        context: { req: Request },
        info: GraphQLResolveInfo,
    ): Promise<Partial<Resource> | null> {
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
            const resource = await unwrapResultAndOption(
                resourceResult,
                context.req,
            );

            // If resource is null, return null; otherwise create a new object
            // containing only the fields specified in the GraphQL projection
            return resource == null ? null : Object.entries(resource).reduce(
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
        context: { req: Request },
        info: GraphQLResolveInfo,
    ): Promise<Partial<Resource> | null> {
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

            const resource = await unwrapResultAndOption(
                resourceResult,
                context.req,
            );

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
        context: { req: Request },
        _info: GraphQLResolveInfo,
    ): Promise<Resource | null> {
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

            const resource = await unwrapResultAndOption(
                resourceResult,
                context.req,
            );

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
        context: { req: Request },
        _info: GraphQLResolveInfo,
    ): Promise<Resource | null> {
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

            const resource = await unwrapResultAndOption(
                resourceResult,
                context.req,
            );

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
        context: { req: Request },
        _info: GraphQLResolveInfo,
    ): Promise<boolean | null> {
        try {
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

            const deleteSuccess = await unwrapResultAndOption(
                deleteResult,
                context.req,
            );

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
