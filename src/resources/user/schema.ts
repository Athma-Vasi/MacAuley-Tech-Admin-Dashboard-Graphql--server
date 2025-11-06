const userTypeDefs = `#graphql
    type User {
        _id: ID!
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
        createdAt: String!
        updatedAt: String!
    }

    type UserServerResponse {
        accessToken: String!
        dataBox: [User]!
        message: String!
        statusCode: Int!
        timestamp: String!
        totalDocuments: Int
        totalPages: Int
    }

    type Query {
        getUserByID(id: ID!): UserServerResponse!
        getUserByUsername(username: String!): UserServerResponse!
        getUsers: UserServerResponse!
    }

    type Mutation {
        createUser(
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
        ): UserServerResponse!

        deleteUserById(id: ID!): UserServerResponse!

        updateUserById(
            id: ID!
            addressLine: String
            city: String
            country: String
            department: String
            email: String
            expireAt: String
            firstName: String
            jobPosition: String
            lastName: String
            orgId: Int
            parentOrgId: Int
            password: String
            postalCodeCanada: String
            postalCodeUS: String
            profilePictureUrl: String
            province: String
            roles: [String!]
            state: String
            storeLocation: String
            username: String
        ): UserServerResponse!
    }
`;

export { userTypeDefs };
