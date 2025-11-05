import type { Types } from "mongoose";
import type { Buffer } from "node:buffer";
import type { IncomingMessage } from "node:http";
import type { Option, Result } from "ts-results";

type StoreLocation = "Calgary" | "Edmonton" | "Vancouver";
type AllStoreLocations = "All Locations" | StoreLocation;

type FileExtension = "jpeg" | "png" | "jpg" | "webp";

type UserRoles = ("Admin" | "Employee" | "Manager")[];

type DecodedToken = {
    userId: Types.ObjectId;
    username: string;
    roles: UserRoles;
    sessionId: Types.ObjectId;
    iat: number;
    exp: number;
};

type RequestBeforeAuth = IncomingMessage;

type RequestAfterSuccessfulAuth = IncomingMessage & {
    accessToken: string;
    decodedToken: DecodedToken;
};

// after file info extractor middleware runs
type RequestWithFileUploads = IncomingMessage & {
    fileUploads: FileInfoObject[];
};
type ServerSuccessResponseGraphQL<Data = unknown> = {
    accessToken: string;
    dataBox: Array<Data>;
    message: string;
    statusCode: number;
    timestamp: Date;
    totalDocuments?: number;
    totalPages?: number;
    // requestId?: string;
    // extensions?: Record<string, unknown>;
    // path?: string[];
};

type ServerErrorResponseGraphQL = {
    accessToken: string;
    dataBox: [];
    message: string;
    statusCode: number;
    timestamp: Date;
    totalDocuments?: number;
    totalPages?: number;
    // requestId?: string;
    // errors?: GraphQLFormattedError[];
    // extensions?: Record<string, unknown>;
    // path?: string[];
};

type ServerResponseGraphQL<Data = unknown> =
    | ServerSuccessResponseGraphQL<Data>
    | ServerErrorResponseGraphQL;

type RecordDB<
    Schema extends Record<string, unknown> = Record<string, unknown>,
> = Schema & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    __v: number;
};

type SafeError = {
    name: string;
    message: string;
    stack: Option<string>;
    original: Option<string>;
};
type SafeResult<Data = unknown> = Result<Option<NonNullable<Data>>, SafeError>;

// gives the final flattened type after mapping, intersecting, or conditional logic
type Prettify<T> =
    & {
        [K in keyof T]: T[K];
    }
    // deno-lint-ignore ban-types
    & {};

/**
 * - Used in the PATCH request body field: 'documentUpdate'.
 * - Shared with frontend to ensure that the request body contains correct data shape.
 */
type DocumentUpdateOperation<
    Document extends Record<string, unknown> = Record<string, unknown>,
> =
    | DocumentFieldUpdateOperation<Document>
    | DocumentArrayUpdateOperation<Document>;

type FieldOperators =
    | "$currentDate"
    | "$inc"
    | "$min"
    | "$max"
    | "$mul"
    | "$rename"
    | "$set"
    | "$setOnInsert"
    | "$unset";

type DocumentFieldUpdateOperation<
    Document extends Record<string, unknown> = Record<string, unknown>,
> = {
    updateKind: "field";
    updateOperator: FieldOperators;
    fields: Partial<Document>;
};

type ArrayOperators = "$addToSet" | "$pop" | "$pull" | "$push" | "$pullAll";

type DocumentArrayUpdateOperation<
    Document extends Record<string, unknown> = Record<string, unknown>,
> = {
    updateKind: "array";
    updateOperator: ArrayOperators;
    fields: Partial<Document>;
};

/**
 * type signature of file object created by express-fileupload
 */
type FileUploadObject = {
    name: string;
    data: Buffer;
    size: number;
    encoding: string;
    tempFilePath: string;
    truncated: boolean;
    mimetype: string;
    md5: string;
    mv: (path: string, callback: (error: unknown) => void) => void;
};

/**
 * type signature of file object created after fileInfoExtracter middleware runs
 */
type FileInfoObject = {
    uploadedFile: Buffer;
    fileName: string;
    fileExtension: FileExtension;
    fileSize: number;
    fileMimeType: string;
    fileEncoding: string;
};

export type {
    AllStoreLocations,
    ArrayOperators,
    DecodedToken,
    DocumentUpdateOperation,
    FieldOperators,
    FileInfoObject,
    FileUploadObject,
    Prettify,
    RecordDB,
    RequestAfterSuccessfulAuth,
    RequestBeforeAuth,
    RequestWithFileUploads,
    SafeError,
    SafeResult,
    ServerErrorResponseGraphQL,
    ServerResponseGraphQL,
    ServerSuccessResponseGraphQL,
    StoreLocation,
    UserRoles,
};
