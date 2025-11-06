import type { SignOptions } from "jsonwebtoken";
import type {
  FilterQuery,
  Model,
  MongooseBaseQueryOptionKeys,
  QueryOptions,
  RootFilterQuery,
} from "mongoose";
import tsresults from "ts-results";
import {
  RetryLimitExceededError,
  TokenCreationError,
} from "../errors/index.ts";
import { AuthModel } from "../resources/auth/model.ts";
import type {
  ArrayOperators,
  DecodedToken,
  FieldOperators,
  Prettify,
  RecordDB,
  SafeResult,
} from "../types.ts";
import {
  createSafeErrorResult,
  createSafeSuccessResult,
  signJWTSafe,
} from "../utils.ts";

const { Ok, None } = tsresults;

const MAX_RETRIES = 3; // maximum number of retries for operations

function attempt<Doc>(
  retry: (retriesLeft: number, error?: unknown) => Promise<SafeResult<Doc>>,
  retriesLeft: number,
  error?: unknown,
): Promise<SafeResult<Doc>> {
  const BACK_OFF_FACTOR = 2; // exponential back-off factor
  const DELAY_BASE_MS = 500; // 500 milliseconds

  const backoff = Math.pow(BACK_OFF_FACTOR, MAX_RETRIES - retriesLeft) *
    DELAY_BASE_MS;
  const jitter = backoff * 0.2 * (Math.random() - 0.5);
  const delay = backoff + jitter;

  console.group("Retrying operation...");
  console.log(`Retries left: ${retriesLeft - 1}`);
  console.log(`Delay: ${Math.round(delay)} ms`);
  console.groupEnd();

  return new Promise((resolve) => {
    setTimeout(() => {
      retry(retriesLeft - 1, error).then(resolve);
    }, delay);
  });
}

async function getResourceByIdService<
  Doc extends Record<PropertyKey, unknown> = RecordDB,
>(
  resourceId: string,
  model: Prettify<Model<Doc>>,
): Promise<SafeResult<Doc>> {
  async function retry<Doc>(
    retriesLeft: number,
    error?: unknown,
  ): Promise<SafeResult<Doc>> {
    if (retriesLeft <= 0) {
      return createSafeErrorResult(new RetryLimitExceededError(error));
    }

    try {
      const resource = await model.findById(resourceId)
        .lean()
        .exec() as Doc;
      return createSafeSuccessResult(resource);
    } catch (error: unknown) {
      return attempt(retry, retriesLeft, error) as Promise<SafeResult<Doc>>;
    }
  }

  return await retry(MAX_RETRIES);
}

async function getResourceByFieldService<
  Doc extends Record<PropertyKey, unknown> = RecordDB,
>({
  model,
  filter,
  projection,
  options,
}: {
  model: Model<Doc>;
  filter: FilterQuery<Doc>;
  projection?: Record<PropertyKey, unknown>;
  options?: QueryOptions<Doc>;
}): Promise<SafeResult<Doc>> {
  async function retry<Doc>(
    retriesLeft: number,
    error?: unknown,
  ): Promise<SafeResult<Doc>> {
    if (retriesLeft <= 0) {
      return createSafeErrorResult(new RetryLimitExceededError(error));
    }

    try {
      const resourceBox = await model.find(filter, projection, options)
        .lean()
        .exec() as Array<Doc>;

      return resourceBox.length === 0 || resourceBox.length > 1 ||
          resourceBox[0] == null ||
          resourceBox[0] == undefined
        ? new Ok(None)
        : createSafeSuccessResult(resourceBox[0]);
    } catch (error_: unknown) {
      return attempt(retry, retriesLeft, error_) as Promise<SafeResult<Doc>>;
    }
  }

  return await retry(MAX_RETRIES);
}

async function getAllResourcesService<
  Doc extends Record<PropertyKey, unknown> = RecordDB,
>({
  model,
  filter,
  projection,
  options,
}: {
  model: Model<Doc>;
  filter: FilterQuery<Doc>;
  projection?: Record<PropertyKey, unknown>;
  options?: QueryOptions<Doc>;
}): Promise<SafeResult<Array<Doc>>> {
  async function retry(
    retriesLeft: number,
    error?: unknown,
  ): Promise<SafeResult<Array<Doc>>> {
    if (retriesLeft <= 0) {
      return createSafeErrorResult(new RetryLimitExceededError(error));
    }

    try {
      const resources = await model.find(filter, projection, options).lean()
        .exec() as Array<Doc>;

      return resources.length === 0
        ? new Ok(None)
        : createSafeSuccessResult(resources);
    } catch (error_: unknown) {
      return attempt(retry, retriesLeft, error_);
    }
  }

  return await retry(MAX_RETRIES);
}

async function createNewResourceService<
  Schema extends Record<PropertyKey, unknown> = Record<PropertyKey, unknown>,
  Doc extends Record<PropertyKey, unknown> = RecordDB,
>(
  schema: Schema,
  model: Model<Doc>,
): Promise<SafeResult<Doc>> {
  async function retry(
    retriesLeft: number,
    error?: unknown,
  ): Promise<SafeResult<Doc>> {
    if (retriesLeft <= 0) {
      return createSafeErrorResult(new RetryLimitExceededError(error));
    }

    try {
      const resource = await model.create(schema) as Doc;
      return createSafeSuccessResult(resource);
    } catch (error_: unknown) {
      return attempt(retry, retriesLeft, error_);
    }
  }

  return await retry(MAX_RETRIES);
}

async function getTotalResourcesService<
  Doc extends Record<PropertyKey, unknown> = RecordDB,
>(
  { filter, model, options }: {
    filter: RootFilterQuery<Doc> | undefined;
    model: Model<Doc>;
    options?: Pick<
      QueryOptions<Doc>,
      MongooseBaseQueryOptionKeys
    >;
  },
): Promise<SafeResult<number>> {
  async function retry(
    retriesLeft: number,
    error?: unknown,
  ): Promise<SafeResult<number>> {
    if (retriesLeft <= 0) {
      return createSafeErrorResult(new RetryLimitExceededError(error));
    }

    try {
      const totalResources = await model.countDocuments(
        filter,
        options,
      )
        .lean()
        .exec();
      return createSafeSuccessResult(totalResources);
    } catch (error_: unknown) {
      return attempt(retry, retriesLeft, error_);
    }
  }

  return await retry(MAX_RETRIES);
}

async function updateResourceByIdService<
  Doc extends Record<PropertyKey, unknown> = RecordDB,
>({
  resourceId,
  updateFields,
  updateOperator,
  model,
}: {
  resourceId: string;
  updateFields: Record<PropertyKey, unknown>;
  model: Model<Doc>;
  updateOperator: FieldOperators | ArrayOperators;
}): Promise<SafeResult<Doc>> {
  async function retry(
    retriesLeft: number,
    error?: unknown,
  ): Promise<SafeResult<Doc>> {
    if (retriesLeft <= 0) {
      return createSafeErrorResult(new RetryLimitExceededError(error));
    }

    try {
      const updateObject = {
        [updateOperator]: updateFields,
      } as Pick<
        QueryOptions<Doc>,
        MongooseBaseQueryOptionKeys
      >;

      const resource = await model.findByIdAndUpdate(
        resourceId,
        updateObject,
        { new: true },
      )
        .lean()
        .exec() as Doc;
      return createSafeSuccessResult(resource);
    } catch (error_: unknown) {
      return attempt(retry, retriesLeft, error_);
    }
  }

  return await retry(MAX_RETRIES);
}

async function deleteResourceByIdService<
  Doc extends Record<PropertyKey, unknown> = RecordDB,
>(
  resourceId: string,
  model: Model<Doc>,
): Promise<SafeResult<boolean>> {
  async function retry(
    retriesLeft: number,
    error?: unknown,
  ): Promise<SafeResult<boolean>> {
    if (retriesLeft <= 0) {
      return createSafeErrorResult(new RetryLimitExceededError(error));
    }

    try {
      const { acknowledged, deletedCount } = await model.deleteOne({
        _id: resourceId,
      })
        .lean()
        .exec();

      return acknowledged && deletedCount === 1
        ? createSafeSuccessResult(true)
        : new Ok(None);
    } catch (error_: unknown) {
      return attempt(retry, retriesLeft, error_);
    }
  }

  return await retry(MAX_RETRIES);
}

async function deleteManyResourcesService<
  Doc extends Record<PropertyKey, unknown> = RecordDB,
>(
  { filter, model, options }: {
    filter?: FilterQuery<Doc>;
    options?: QueryOptions<Doc>;
    model: Model<Doc>;
  },
): Promise<SafeResult<boolean>> {
  async function retry(
    retriesLeft: number,
    error?: unknown,
  ): Promise<SafeResult<boolean>> {
    if (retriesLeft <= 0) {
      return createSafeErrorResult(new RetryLimitExceededError(error));
    }

    try {
      const totalResources = await model.countDocuments(
        filter,
        options as Pick<
          QueryOptions<Doc>,
          MongooseBaseQueryOptionKeys
        >,
      )
        .lean()
        .exec() as number;

      const { acknowledged, deletedCount } = await model.deleteMany(
        filter,
        options as Pick<
          QueryOptions<Doc>,
          MongooseBaseQueryOptionKeys
        >,
      )
        .lean()
        .exec();

      return acknowledged && deletedCount === totalResources
        ? createSafeSuccessResult(true)
        : new Ok(None);
    } catch (error_: unknown) {
      return attempt(retry, retriesLeft, error_);
    }
  }

  return await retry(MAX_RETRIES);
}

async function createTokenService(
  { accessToken, expiresIn, oldDecodedToken, seed }: {
    accessToken: string;
    oldDecodedToken: DecodedToken;
    expiresIn: SignOptions["expiresIn"];
    seed: string;
  },
): Promise<SafeResult<string>> {
  async function retry(
    retriesLeft: number,
    error?: unknown,
  ): Promise<SafeResult<string>> {
    if (retriesLeft <= 0) {
      return createSafeErrorResult(new RetryLimitExceededError(error));
    }

    try {
      const {
        userId,
        roles,
        username,
        sessionId,
      } = oldDecodedToken;

      // get current session info from DB
      const getSessionResult = await getResourceByIdService(
        sessionId.toString(),
        AuthModel,
      );
      if (getSessionResult.err) {
        return createSafeErrorResult(getSessionResult.val);
      }
      const sessionMaybe = getSessionResult.safeUnwrap();
      // session has maybe expired ( > 24 hours)
      // user will be required to log in again
      if (sessionMaybe.none) {
        return createSafeErrorResult(
          new TokenCreationError("Session not found"),
        );
      }
      const session = sessionMaybe.unwrap();

      // if the incoming access token is not the same as the one in the database
      if (session.currentlyActiveToken.trim() !== accessToken.trim()) {
        // invalidate currently active session
        const deleteSessionResult = await deleteResourceByIdService(
          sessionId.toString(),
          AuthModel,
        );
        if (deleteSessionResult.err) {
          return createSafeErrorResult(deleteSessionResult.val);
        }
        return createSafeErrorResult(
          new TokenCreationError("Session invalidated"),
        );
      }

      // create a new access token
      // and use existing session ID to sign new token
      const newAccessTokenResult = signJWTSafe({
        payload: {
          userId,
          username,
          roles,
          sessionId: session._id.toString(),
        },
        secretOrPrivateKey: seed,
        options: expiresIn === undefined ? {} : {
          expiresIn,
        },
      });
      if (newAccessTokenResult.err) {
        return createSafeErrorResult(newAccessTokenResult.val);
      }
      const newAccessTokenMaybe = newAccessTokenResult.safeUnwrap();
      if (newAccessTokenMaybe.none) {
        return createSafeErrorResult(
          new TokenCreationError("Failed to create new access token"),
        );
      }
      const newAccessToken = newAccessTokenMaybe.unwrap();

      // update the session in the database with the new access token
      const updateSessionResult = await updateResourceByIdService({
        resourceId: sessionId.toString(),
        updateFields: {
          currentlyActiveToken: newAccessToken,
        },
        updateOperator: "$set",
        model: AuthModel,
      });
      if (updateSessionResult.err) {
        return createSafeErrorResult(updateSessionResult.val);
      }
      const updatedSessionMaybe = updateSessionResult.safeUnwrap();
      if (updatedSessionMaybe.none) {
        return createSafeErrorResult(
          new TokenCreationError("Failed to update session with new token"),
        );
      }

      // update session was successful
      // return the new access token
      return createSafeSuccessResult(newAccessToken);
    } catch (error: unknown) {
      return createSafeErrorResult(new TokenCreationError(error));
    }
  }

  return await retry(MAX_RETRIES);
}

export {
  createNewResourceService,
  createTokenService,
  deleteManyResourcesService,
  deleteResourceByIdService,
  getAllResourcesService,
  getResourceByFieldService,
  getResourceByIdService,
  getTotalResourcesService,
  updateResourceByIdService,
};
