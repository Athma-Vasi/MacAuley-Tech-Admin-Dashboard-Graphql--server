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
        getUser(id: ID!): User
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

        deleteUser(id: ID!): Boolean!

        updateUser(
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
