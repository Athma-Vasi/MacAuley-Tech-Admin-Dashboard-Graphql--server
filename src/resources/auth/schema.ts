export const authTypeDefs = `#graphql
    type Auth {
        id: ID!
        currentlyActiveToken: String!
        addressIP: String!
        expireAt: String
        userAgent: String!
        userId: ID!
        username: String!
        createdAt: String!
        updatedAt: String!
    }

    type Query {
        getAuthSessionById(id: ID!): Auth
        getCurrentSession: Auth
    }

    type Mutation {
        createAuthSession(input: CreateAuthSessionInput!): Auth!
        refreshAuthSession(sessionId: ID!): Auth!
        revokeAuthSession(sessionId: ID!): Boolean!
    }

    input CreateAuthSessionInput {
        currentlyActiveToken: String!
        addressIP: String!
        userAgent: String!
        userId: ID!
        username: String!
    }
`;
