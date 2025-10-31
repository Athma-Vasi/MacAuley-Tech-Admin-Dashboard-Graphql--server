import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { connectDB } from "./src/config/connectDB.ts";
import { CONFIG } from "./src/config/index.ts";
import { resolvers } from "./src/schema/resolvers.ts";
import { typeDefs } from "./src/schema/typeDefs.ts";

try {
    await connectDB(CONFIG);

    const server = new ApolloServer({
        typeDefs,
        resolvers,
    });

    const { url } = await startStandaloneServer(server);
    console.log(`🚀 Server is running at: ${url}`);
} catch (error) {
    console.error("Failed to start the server:", error);
}
