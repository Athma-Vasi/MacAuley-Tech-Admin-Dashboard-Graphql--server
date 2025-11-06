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
    }

    type FileUploadServerResponse {
        accessToken: String!
        dataBox: [FileUpload]!
        message: String!
        statusCode: Int!
        timestamp: String!
        totalDocuments: Int
        totalPages: Int
    }

    type Query {
        getFileUploadById(_id: ID!): FileUploadServerResponse!
        getAllFileUploads: FileUploadServerResponse!
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
        ): FileUploadServerResponse!
        deleteFileUploadById(id: ID!): FileUploadServerResponse!
    }
`;

export { fileUploadTypeDefs };
