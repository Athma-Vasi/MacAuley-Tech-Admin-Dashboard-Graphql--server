import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { connectDB } from "./src/config/connectDB.ts";
import { CONFIG } from "./src/config/index.ts";
import { userResolvers } from "./src/resources/user/resolvers.ts";
import { userTypeDefs } from "./src/resources/user/schema.ts";

try {
    await connectDB(CONFIG);

    const server = new ApolloServer({
        typeDefs: userTypeDefs,
        resolvers: userResolvers,
    });

    const { url } = await startStandaloneServer(server);
    console.log(`🚀 Server is running at: ${url}`);
} catch (error) {
    console.error("Failed to start the server:", error);
}
