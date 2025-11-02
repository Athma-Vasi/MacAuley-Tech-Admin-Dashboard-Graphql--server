import type { GraphQLResolveInfo } from "graphql";
import tsresults, { type ErrImpl, type OkImpl, type Option } from "ts-results";
import { PROPERTY_DESCRIPTOR } from "./constants.ts";
import type { SafeError } from "./types.ts";
const { Err, None, Ok, Some } = tsresults;

function createSafeSuccessResult<Data = unknown>(
    data: Data,
): OkImpl<Option<NonNullable<Data>>> {
    return new Ok(data == null || data == undefined ? None : Some(data));
}

function serializeSafe(data: unknown): Option<string> {
    try {
        const serialized = JSON.stringify(data, null, 2);
        return Some(serialized);
    } catch (_error: unknown) {
        return None;
    }
}

function createSafeErrorResult(
    error: unknown,
): ErrImpl<SafeError> {
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
                message: error.reason.toString() ?? "No reason provided",
                stack: None,
                original: serializeSafe(error),
            });
        }

        return new Err({
            name: `EventError: ${error.type}`,
            message: error.timeStamp.toString() ?? "No timestamp provided",
            stack: None,
            original: serializeSafe(error),
        });
    }

    return new Err({
        name: "SimulationDysfunction",
        message: "You've seen it before. Déjà vu. Something's off...",
        stack: None,
        original: serializeSafe(error),
    });
}

function getProjectionFromInfo(
    info: GraphQLResolveInfo,
): Record<string, 1> {
    const { fieldNodes } = info;
    const selections = fieldNodes[0]?.selectionSet?.selections ?? [];

    return selections.reduce((projection, selection) => {
        if (selection.kind === "Field") {
            const fieldName = selection.name.value;
            Object.defineProperty(projection, fieldName, {
                value: 1,
                ...PROPERTY_DESCRIPTOR,
            });
        }

        return projection;
    }, {});
}

export {
    createSafeErrorResult,
    createSafeSuccessResult,
    getProjectionFromInfo,
};
