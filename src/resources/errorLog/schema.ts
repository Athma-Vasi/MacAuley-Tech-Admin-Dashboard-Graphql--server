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

    type Query {
        getErrorLogs: [ErrorLog!]!
        getErrorLogById(id: ID!): ErrorLog
        getErrorLogByField(field: String!, value: String!): ErrorLog
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
        ): ErrorLog!

        updateErrorLog(
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
        ): ErrorLog!

        deleteErrorLog(id: ID!): Boolean!
    }
`;
