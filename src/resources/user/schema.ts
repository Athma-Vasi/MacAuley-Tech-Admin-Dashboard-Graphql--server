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

    type ServerResponse {
        accessToken: String!
        dataBox: [User!]!
        message: String!
        statusCode: Int!
        timestamp: String!
        totalDocuments: Int
        totalPages: Int
    }

    type Query {
        getUserByID(id: ID!): ServerResponse!
        getUserByUsername(username: String!): ServerResponse!
        getUsers: ServerResponse!
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
        ): User!

        deleteUserById(id: ID!): Boolean!

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
        ): User!
    }
`;

export { userTypeDefs };
