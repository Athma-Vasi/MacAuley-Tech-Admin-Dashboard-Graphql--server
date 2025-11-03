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
        checkUsernameExistsAtRegister(username: String!): Boolean!
        checkEmailExistsAtRegister(email: String!): Boolean!
    }

    type Mutation {
        # createAuthSession(input: CreateAuthSessionInput!): Auth!
        # refreshAuthSession(sessionId: ID!): Auth!
        # revokeAuthSession(sessionId: ID!): Boolean!
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
        ): User!

        loginUser(username: String!, password: String!): Auth!

        logoutUser(sessionId: ID!): Boolean!
    }

    input CreateAuthSessionInput {
        currentlyActiveToken: String!
        addressIP: String!
        userAgent: String!
        userId: ID!
        username: String!
    }
`;
