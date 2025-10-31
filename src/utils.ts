import { Err, None, Ok, Option, Some } from "ts-results";
import type { SafeError } from "./types.ts";

function createSafeSuccessResult<Data = unknown>(
    data: Data,
): Ok<Option<NonNullable<Data>>> {
    return new Ok(data == null ? None : Some(data));
}

function serializeSafe(data: unknown): string {
    try {
        const serializedData = JSON.stringify(data, null, 2);
        return serializedData;
    } catch (error: unknown) {
        return "Unserializable data";
    }
}

function createSafeErrorResult(
    error: unknown,
): Err<SafeError> {
    if (error instanceof Error) {
        return new Err({
            name: error.name ?? "Error",
            message: error.message ?? "Unknown error",
            stack: error.stack == null ? None : Some(error.stack),
            original: None,
        });
    }

    if (typeof error === "string") {
        return new Err({
            name: "Error",
            message: error,
            stack: None,
            original: None,
        });
    }

    if (error instanceof Event) {
        if (error instanceof PromiseRejectionEvent) {
            return new Err({
                name: `PromiseRejectionEvent: ${error.type}`,
                message: error.reason.toString() ?? "",
                stack: None,
                original: Some(serializeSafe(error)),
            });
        }

        return new Err({
            name: `EventError: ${error.type}`,
            message: error.timeStamp.toString() ?? "",
            stack: None,
            original: Some(serializeSafe(error)),
        });
    }

    return new Err({
        name: "SimulationDysfunction",
        message: "You've seen it before. Déjà vu. Something's off...",
        stack: None,
        original: Some(serializeSafe(error)),
    });
}

export { createSafeErrorResult, createSafeSuccessResult };
