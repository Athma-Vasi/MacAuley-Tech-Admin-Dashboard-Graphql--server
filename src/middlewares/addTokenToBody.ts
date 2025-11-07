import http from "node:http";
import { PROPERTY_DESCRIPTOR } from "../constants.ts";

/**
 * This middleware extracts the token from the Authorization header and adds it to the request body.
 */

function addTokenToBody(
    request: http.IncomingMessage & { accessToken?: string },
    _response: http.ServerResponse,
    next: (err?: unknown) => void,
): void {
    const token = request.headers.authorization?.split(" ")[1] ?? "not-a-token";

    Object.defineProperty(request, "accessToken", {
        value: token,
        ...PROPERTY_DESCRIPTOR,
    });

    console.group("addTokenToBody Middleware");
    console.log("Headers:", request.headers);
    console.log("accessToken:", request.accessToken);
    console.log("\n");
    console.groupEnd();

    // next(new Error("Authorization token is missing."));
    next();
    return;
}

export { addTokenToBody };
