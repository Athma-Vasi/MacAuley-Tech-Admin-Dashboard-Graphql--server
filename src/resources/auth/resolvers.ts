import type { Request } from "express";
import { getResourceByIdResolver } from "../../resolvers/index.ts";
import { getResourceByFieldService } from "../../services/index.ts";
import { handleCatchBlockError, handleErrorResult } from "../../utils.ts";
import { AuthModel } from "./model.ts";
import type { UserSchema } from "../user/model.ts";

const authResolvers = {
    Query: {
        getAuthSessionById: getResourceByIdResolver(AuthModel),

        checkUsernameExistsAtRegister: async (
            _: unknown,
            args: { username: string },
            context: { req: Request },
        ): Promise<boolean> => {
            try {
                const filter = args;
                const options = {};
                const projection = {};

                console.group(
                    "Checking if username exists at register:",
                    args.username,
                );

                const existingUserResult = await getResourceByFieldService({
                    model: AuthModel,
                    filter,
                    projection,
                    options,
                });
                if (existingUserResult.err) {
                    await handleErrorResult(
                        existingUserResult,
                        context.req,
                    );
                    return true;
                }

                const existsMaybe = existingUserResult.safeUnwrap();
                if (existsMaybe.some) {
                    return true;
                }

                return false;
            } catch (error: unknown) {
                await handleCatchBlockError(
                    error,
                    context.req,
                );
                return true;
            }
        },

        checkEmailExistsAtRegister: async (
            _: unknown,
            args: { email: string },
            context: { req: Request },
        ): Promise<boolean> => {
            try {
                const filter = args;
                const options = {};
                const projection = {};

                console.group(
                    "Checking if email exists at register:",
                    args.email,
                );

                const existingUserResult = await getResourceByFieldService({
                    model: AuthModel,
                    filter,
                    projection,
                    options,
                });
                if (existingUserResult.err) {
                    await handleErrorResult(
                        existingUserResult,
                        context.req,
                    );
                    return true;
                }

                const existsMaybe = existingUserResult.safeUnwrap();
                if (existsMaybe.some) {
                    return true;
                }

                return false;
            } catch (error: unknown) {
                await handleCatchBlockError(
                    error,
                    context.req,
                );
                return true;
            }
        },
    },

    Mutation: {
        registerUser: async (
            _: unknown,
            args: UserSchema,
            context: { req: Request },
        ) => {
        },

        loginUser: async (
            _: unknown,
            args: { username: string; password: string },
            context: { req: Request },
        ) => {
            // Implementation in auth/mutations/loginUser.ts
        },

        logoutUser: async (
            _: unknown,
            args: { sessionId: string },
            context: { req: Request },
        ) => {
            // Implementation in auth/mutations/logoutUser.ts
        },
    },
};

export { authResolvers };
