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

    type AuthServerResponse {
        accessToken: String!
        dataBox: [Auth]!
        message: String!
        statusCode: Int!
        timestamp: String!
        totalDocuments: Int
        totalPages: Int
    }

    type Query {
        getAllAuthSessions: AuthServerResponse!
        getAuthSessionById(id: ID!): AuthServerResponse!
        checkUsernameOrEmailExists(username: String, email:String): AuthServerResponse!        
    }

    type Mutation {
        registerUser(
            addressLine: String!
            city: String!
            country: String!
            department: String!
            email: String!
            expireAt: String
            firstName: String!
            jobPosition: String!
            lastName: String!
            orgId: Int!
            parentOrgId: Int!
            password: String!
            postalCodeCanada: String!
            postalCodeUS: String!
            profilePictureUrl: String
            province: String!
            roles: [String!]!
            state: String!
            storeLocation: String!
            username: String!
        ): AuthServerResponse!

        loginUser(username: String!, password: String!): AuthServerResponse!

        logoutUser(sessionId: ID!): AuthServerResponse!
    }

    input CreateAuthSessionInput {
        currentlyActiveToken: String!
        addressIP: String!
        userAgent: String!
        userId: ID!
        username: String!
    }
`;
