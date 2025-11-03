const fileUploadTypeDefs = `#graphql
    type FileUpload {
        _id: ID!
        userId: ID!
        uploadedFile: String!
        username: String!
        expireAt: String
        fileExtension: String!
        fileName: String!
        fileSize: Int!
        fileMimeType: String!
        fileEncoding: String!
        associatedDocumentId: ID
        createdAt: String!
        updatedAt: String!
        __v: Int!
    }

    type Query {
        getFileUploadById(_id: ID!): FileUpload
        getAllFileUploads: [FileUpload!]!
    }

    type Mutation {
        uploadFile(
            userId: ID!
            uploadedFile: String!
            username: String!
            fileExtension: String!
            fileName: String!
            fileSize: Int!
            fileMimeType: String!
            fileEncoding: String!
            expireAt: String
        ): FileUpload!
        deleteFileUploadById(id: ID!): Boolean!
    }
`;

export { fileUploadTypeDefs };
