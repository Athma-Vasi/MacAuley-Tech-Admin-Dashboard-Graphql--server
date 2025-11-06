import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@as-integrations/express5";
import compression from "compression";
import cors from "cors";
import express from "express";
import expressFileUpload from "express-fileupload";
import helmet from "helmet";
import morgan from "morgan";
import http from "node:http";
import { connectDB } from "./src/config/connectDB.ts";
import { CONFIG } from "./src/config/index.ts";
import { addTokenToBody } from "./src/middlewares/addTokenToBody.ts";
import { fileExtensionLimiterMiddleware } from "./src/middlewares/fileExtensionLimiter.ts";
import { fileInfoExtractorMiddleware } from "./src/middlewares/fileInfoExtractor.ts";
import { filesPayloadExistsMiddleware } from "./src/middlewares/filePayloadExists.ts";
import { fileSizeLimiterMiddleware } from "./src/middlewares/fileSizeLimiter.ts";
import { authResolvers } from "./src/resources/auth/resolvers.ts";
import { authTypeDefs } from "./src/resources/auth/schema.ts";
import { errorLogResolvers } from "./src/resources/errorLog/resolvers.ts";
import { errorLogTypeDefs } from "./src/resources/errorLog/schema.ts";
import { fileUploadResolvers } from "./src/resources/fileUpload/resolvers.ts";
import { fileUploadTypeDefs } from "./src/resources/fileUpload/schema.ts";
import { userResolvers } from "./src/resources/user/resolvers.ts";
import { userTypeDefs } from "./src/resources/user/schema.ts";
import { mergeResolvers } from "./src/utils.ts";

type AppContext = {
    token?: string;
};

const { MONGO_URI, PORT } = CONFIG;

try {
    const app = express();
    const httpServer = http.createServer(app);

    await connectDB(MONGO_URI);

    const server = new ApolloServer<AppContext>({
        typeDefs: userTypeDefs + authTypeDefs + errorLogTypeDefs +
            fileUploadTypeDefs,
        resolvers: mergeResolvers([
            userResolvers,
            authResolvers,
            errorLogResolvers,
            fileUploadResolvers,
        ]),
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    });

    await server.start();

    // register route involves file upload
    app.use(
        "/auth/register",
        cors<cors.CorsRequest>(),
        express.json(),
        helmet(),
        compression(),
        expressFileUpload({ createParentPath: true }),
        filesPayloadExistsMiddleware as express.RequestHandler,
        fileSizeLimiterMiddleware as express.RequestHandler,
        fileExtensionLimiterMiddleware as express.RequestHandler,
        fileInfoExtractorMiddleware as express.RequestHandler,
        expressMiddleware(server, {
            // deno-lint-ignore require-await
            context: async ({ req }) => {
                return req;
            },
        }),
    );

    app.use(
        "/auth",
        cors<cors.CorsRequest>(),
        express.json(),
        morgan("dev"),
        helmet(),
        compression(),
        expressMiddleware(server, {
            // deno-lint-ignore require-await
            context: async ({ req }) => {
                return req;
            },
        }),
    );

    app.use(
        "/graphql",
        cors<cors.CorsRequest>(),
        express.json(),
        helmet(),
        compression(),
        morgan("dev"),
        addTokenToBody,
        expressMiddleware(server, {
            // deno-lint-ignore require-await
            context: async ({ req: request }) => {
                // const token = req.headers.authorization || "";
                // return { token };
                return { request };
            },
        }),
    );

    await new Promise<void>((resolve) => {
        httpServer.listen({ port: PORT }, resolve);
    });
    console.log(
        `🚀 Server is running at http://localhost:${PORT}/graphql`,
    );
} catch (error) {
    console.error("Failed to start the server:", error);
}
