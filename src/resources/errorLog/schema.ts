const errorLogTypeDefs = `#graphql
    type ErrorLog {
        id: ID!
        method: String
        path: String
        headers: String
        body: String
        ip: String
        userAgent: String
        original: String!
        expireAt: String
        userId: String!
        username: String!
        sessionId: String!
        message: String!
        name: String!
        stack: String!
        timestamp: String
        createdAt: String!
        updatedAt: String!
    }

    type ErrorLogServerResponse {
        accessToken: String!
        dataBox: [ErrorLog]!
        message: String!
        statusCode: Int!
        timestamp: String!
        totalDocuments: Int
        totalPages: Int
    }

    type Query {
        getAllErrorLogs: ErrorLogServerResponse!
        getErrorLogById(id: ID!): ErrorLogServerResponse!
        getErrorLogByField(field: String!, value: String!): ErrorLogServerResponse!
    }
    
    type Mutation {
        createErrorLog(
            method: String
            path: String
            headers: String
            body: String
            ip: String
            userAgent: String
            original: String!
            expireAt: String
            userId: String!
            username: String!
            sessionId: String!
            message: String!
            name: String!
            stack: String!
            timestamp: String
        ): ErrorLogServerResponse!        

        updateErrorLogById(
            id: ID!
            method: String
            path: String
            headers: String
            body: String
            ip: String
            userAgent: String
            original: String
            expireAt: String
            userId: String
            username: String
            sessionId: String
            message: String
            name: String
            stack: String
            timestamp: String
        ): ErrorLogServerResponse!

        deleteErrorLogById(id: ID!): ErrorLogServerResponse!
    }
`;

export { errorLogTypeDefs };
