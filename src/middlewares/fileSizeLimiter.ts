import type { NextFunction, Request, Response } from "express";
import type { FileUploadObject } from "../types.ts";

function fileSizeLimiterMiddleware(
    request: Request,
    _response: Response,
    next: NextFunction,
) {
    const MB = 1; // 1MB
    const FILE_SIZE_LIMIT = MB * 1024 * 1024;

    // this middleware only runs if filesPayloadExistsMiddleware has passed - files cannot be undefined
    const files = request.files as unknown as
        | FileUploadObject
        | FileUploadObject[];

    if (!files || (Array.isArray(files) && files.length === 0)) {
        next();
        return;
    }

    const filesOverLimit = Object.entries(files).reduce<FileUploadObject[]>(
        (acc, [_, fileObject]) => {
            if (fileObject.size > FILE_SIZE_LIMIT) {
                acc.push(fileObject);
            }
            return acc;
        },
        [],
    );

    if (filesOverLimit.length > 0) {
        const progressiveApostrophe = filesOverLimit.length > 1 ? "'s" : " ";
        const properVerb = filesOverLimit.length > 1 ? " are" : "is";

        const message =
            `Upload failed. The following file${progressiveApostrophe}${properVerb} over ${MB}MB: ${
                filesOverLimit
                    .map((file) => file.name)
                    .join(", ")
            }`;

        next(new Error(message));
        return;
    }

    next();
    return;
}

export { fileSizeLimiterMiddleware };
