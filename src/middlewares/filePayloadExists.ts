import type { NextFunction, Request, Response } from "express";
import type { FileUploadObject } from "../types.ts";

function filesPayloadExistsMiddleware(
    request: Request,
    _response: Response,
    next: NextFunction,
) {
    const files = request.files as
        | FileUploadObject
        | FileUploadObject[]
        | undefined;

    if (!files || (Array.isArray(files) && files.length === 0)) {
        next(
            new Error("No files found in request object"),
        );
        return;
    }

    next();
    return;
}

export { filesPayloadExistsMiddleware };
