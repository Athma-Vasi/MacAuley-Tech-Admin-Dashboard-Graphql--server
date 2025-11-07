import { model, Schema, type Types, type ValidatorProps } from "mongoose";
import { Buffer } from "node:buffer";
import { FILE_UPLOAD_EXPIRY } from "../../constants.ts";
import {
    FILE_ENCODING_REGEX,
    FILE_EXTENSIONS_REGEX,
    FILE_MIME_TYPES_REGEX,
    FILE_NAME_REGEX,
    FILE_SIZE_REGEX,
    USERNAME_REGEX,
} from "../../regex/index.ts";

type FileExtension = "jpeg" | "png" | "jpg" | "webp";

type FileUploadSchema = {
    userId: Types.ObjectId;
    uploadedFile: Buffer;
    username: string;
    expireAt?: Date;
    fileExtension: FileExtension;
    fileName: string;
    fileSize: number;
    fileMimeType: string;
    fileEncoding: string;
};

type FileUploadDocument = FileUploadSchema & {
    _id: Types.ObjectId;
    associatedDocumentId?: Types.ObjectId | string;
    createdAt: Date;
    updatedAt: Date;
    __v: number;
};

const fileUploadSchema = new Schema<FileUploadDocument>(
    {
        expireAt: {
            type: Date,
            default: () => new Date(FILE_UPLOAD_EXPIRY), // 1 hour
            // index: { expires: "1m" }, // 1 hour
            expires: "1h",
        },
        associatedDocumentId: {
            type: String,
            required: false,
        },
        userId: {
            type: Schema.Types.ObjectId,
            required: [true, "User Id is required. Received {VALUE}"],
            ref: "User",
            index: true,
        },
        uploadedFile: {
            type: Buffer,
            required: [true, "Uploaded file is required. Received {VALUE}"],
        },
        username: {
            type: String,
            required: [true, "Username is required. Received {VALUE}"],
            validate: {
                validator: function usernameValidator(v: string) {
                    return USERNAME_REGEX.test(v);
                },
                message: (props: ValidatorProps) =>
                    `${props.value} is not a valid username. 
                     Usernames must be 3-48 characters long, can contain alphanumeric characters,
                     hyphens, underscores, and periods, cannot start with a hyphen, underscore, 
                     or period, and cannot consist entirely of zeroes.`,
            },
        },

        fileExtension: {
            type: String,
            required: [true, "File extension is required. Received {VALUE}"],
            index: true,
            validate: {
                validator: function fileExtensionValidator(v: string) {
                    return FILE_EXTENSIONS_REGEX.test(v);
                },
                message: (props: ValidatorProps) =>
                    `${props.value} is not a supported file extension. 
                     Supported extensions are: jpeg, png, jpg, webp.`,
            },
        },
        fileName: {
            type: String,
            required: [true, "File name is required. Received {VALUE}"],
            validate: {
                validator: function fileNameValidator(v: string) {
                    return FILE_NAME_REGEX.test(v);
                },
                message: (props: ValidatorProps) =>
                    `${props.value} is not a valid file name. 
                     File names can only contain letters, digits, spaces, periods, commas, 
                     apostrophes, hyphens, and parentheses, and must be between 1 and 50 characters long.`,
            },
        },
        fileSize: {
            type: Number,
            required: [true, "File size is required. Received {VALUE}"],
            validate: {
                validator: function fileSizeValidator(v: number) {
                    return FILE_SIZE_REGEX.test(v.toString());
                },
                message: (props: ValidatorProps) =>
                    `${props.value} is not a valid file size. 
                     File size must be a number between 1 and 999999 bytes (approximately 1MB).`,
            },
        },
        fileMimeType: {
            type: String,
            required: [true, "File MIME type is required. Received {VALUE}"],
            validate: {
                validator: function fileMimeTypeValidator(v: string) {
                    return FILE_MIME_TYPES_REGEX.test(v);
                },
                message: (props: ValidatorProps) =>
                    `${props.value} is not a supported file MIME type. 
                     Supported MIME types are: image/jpeg, image/png, image/webp.`,
            },
        },
        fileEncoding: {
            type: String,
            required: [true, "File encoding is required. Received {VALUE}"],
            validate: {
                validator: function fileEncodingValidator(v: string) {
                    return FILE_ENCODING_REGEX.test(v);
                },
                message: (props: ValidatorProps) =>
                    `${props.value} is not a supported file encoding. 
                     Supported encodings are: 7bit, 8bit, binary, quoted-printable, base64.`,
            },
        },
    },
    {
        timestamps: true,
    },
);

// text index for searching
fileUploadSchema.index({
    username: "text",
    fileMimeType: "text",
    fileEncoding: "text",
});

const FileUploadModel = model(
    "FileUpload",
    fileUploadSchema,
);

export { FileUploadModel };
export type { FileExtension, FileUploadDocument, FileUploadSchema };
