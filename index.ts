import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@as-integrations/express5";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import http from "node:http";
import { connectDB } from "./src/config/connectDB.ts";
import { CONFIG } from "./src/config/index.ts";
import { userResolvers } from "./src/resources/user/resolvers.ts";
import { userTypeDefs } from "./src/resources/user/schema.ts";

type AppContext = {
    token?: string;
};

const { MONGO_URI, PORT } = CONFIG;

try {
    const app = express();
    const httpServer = http.createServer(app);

    await connectDB(MONGO_URI);

    const server = new ApolloServer<AppContext>({
        typeDefs: userTypeDefs,
        resolvers: userResolvers,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    });

    await server.start();

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
        expressMiddleware(server, {
            // deno-lint-ignore require-await
            context: async ({ req }) => {
                // const token = req.headers.authorization || "";
                // return { token };
                return req;
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
