import type { IncomingMessage, ServerResponse } from "node:http";
import { CONFIG } from "../config/index.ts";
import { ACCESS_TOKEN_EXPIRY, PROPERTY_DESCRIPTOR } from "../constants.ts";
import { createTokenService } from "../services/index.ts";
import { decodeJWTSafe, verifyJWTSafe } from "../utils.ts";

async function verifyJWT(
    request: IncomingMessage,
    _response: ServerResponse,
    next: (err?: unknown) => void,
) {
    const [_, accessToken] = request.headers.authorization?.split(" ") ?? [];
    if (!accessToken) {
        next(new Error("No access token provided"));
        return;
    }

    const { ACCESS_TOKEN_SEED } = CONFIG;

    const verifiedTokenResult = verifyJWTSafe({
        seed: ACCESS_TOKEN_SEED,
        token: accessToken,
    });

    // token is invalid and not expired
    if (verifiedTokenResult.err) {
        next(new Error("Invalid access token"));
        return;
    }

    // token is verified, valid and maybe expired
    // can now safely decode it
    const decodedTokenResult = decodeJWTSafe(accessToken);

    if (decodedTokenResult.err) {
        next(new Error("Failed to decode access token"));
        return;
    }
    const decodedTokenMaybe = decodedTokenResult.safeUnwrap();
    if (decodedTokenMaybe.none) {
        next(new Error("Decoded token is none"));
        return;
    }
    const decodedToken = decodedTokenMaybe.unwrap();

    // always create new token
    const tokenCreationResult = await createTokenService({
        accessToken,
        expiresIn: ACCESS_TOKEN_EXPIRY,
        oldDecodedToken: decodedToken,
        seed: ACCESS_TOKEN_SEED,
    });
    if (tokenCreationResult.err) {
        next(new Error("Failed to create new access token"));
        return;
    }

    const newAccessTokenMaybe = tokenCreationResult.safeUnwrap();
    if (newAccessTokenMaybe.none) {
        next(new Error("New access token is none"));
        return;
    }

    const newAccessToken = newAccessTokenMaybe.unwrap();

    Object.defineProperty(request, "accessToken", {
        value: newAccessToken,
        ...PROPERTY_DESCRIPTOR,
    });
    Object.defineProperty(request, "decodedToken", {
        value: decodedToken,
        ...PROPERTY_DESCRIPTOR,
    });

    next();
    return;
}

export { verifyJWT };
