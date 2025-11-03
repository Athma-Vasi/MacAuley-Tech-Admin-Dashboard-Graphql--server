const userTypeDefs = `#graphql
    type User {
        id: ID!
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
    }

    type Query {
        getUserByID(id: ID!): User
        getUserByUsername(username: String!): User
        getUsers: [User!]!
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
