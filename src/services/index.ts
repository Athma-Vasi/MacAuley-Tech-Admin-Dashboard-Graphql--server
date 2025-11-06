import type {
  FilterQuery,
  Model,
  MongooseBaseQueryOptionKeys,
  QueryOptions,
  RootFilterQuery,
} from "mongoose";
import tsresults from "ts-results";
import type {
  ArrayOperators,
  FieldOperators,
  Prettify,
  RecordDB,
  SafeResult,
} from "../types.ts";
import { createSafeErrorResult, createSafeSuccessResult } from "../utils.ts";

const { Ok, None } = tsresults;

const MAX_RETRIES = 3; // maximum number of retries for operations

function attempt<Doc>(
  retry: (retriesLeft: number) => Promise<SafeResult<Doc>>,
  retriesLeft: number,
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
      retry(retriesLeft - 1).then(resolve);
    }, delay);
  });
}

async function getResourceByIdService<
  Doc extends Record<PropertyKey, unknown> = RecordDB,
>(
  resourceId: string,
  model: Prettify<Model<Doc>>,
): Promise<SafeResult<Doc>> {
  async function retry<Doc>(retriesLeft: number): Promise<SafeResult<Doc>> {
    if (retriesLeft <= 0) {
      return createSafeErrorResult(new Error("Max retries exceeded"));
    }

    try {
      const resource = await model.findById(resourceId)
        .lean()
        .exec() as Doc;
      return createSafeSuccessResult(resource);
    } catch (_error: unknown) {
      return attempt(retry, retriesLeft) as Promise<SafeResult<Doc>>;
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
  async function retry<Doc>(retriesLeft: number): Promise<SafeResult<Doc>> {
    if (retriesLeft <= 0) {
      return createSafeErrorResult(new Error("Max retries exceeded"));
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
    } catch (_error: unknown) {
      return attempt(retry, retriesLeft) as Promise<SafeResult<Doc>>;
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
  async function retry(retriesLeft: number): Promise<SafeResult<Array<Doc>>> {
    if (retriesLeft <= 0) {
      return createSafeErrorResult(new Error("Max retries exceeded"));
    }

    try {
      const resources = await model.find(filter, projection, options).lean()
        .exec() as Array<Doc>;

      return resources.length === 0
        ? new Ok(None)
        : createSafeSuccessResult(resources);
    } catch (_error: unknown) {
      return attempt(retry, retriesLeft);
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
  async function retry(retriesLeft: number): Promise<SafeResult<Doc>> {
    if (retriesLeft <= 0) {
      return createSafeErrorResult(new Error("Max retries exceeded"));
    }

    try {
      const resource = await model.create(schema) as Doc;
      return createSafeSuccessResult(resource);
    } catch (_error: unknown) {
      return attempt(retry, retriesLeft);
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
  async function retry(retriesLeft: number): Promise<SafeResult<number>> {
    if (retriesLeft <= 0) {
      return createSafeErrorResult(new Error("Max retries exceeded"));
    }

    try {
      const totalResources = await model.countDocuments(
        filter,
        options,
      )
        .lean()
        .exec();
      return createSafeSuccessResult(totalResources);
    } catch (_error: unknown) {
      return attempt(retry, retriesLeft);
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
  async function retry(retriesLeft: number): Promise<SafeResult<Doc>> {
    if (retriesLeft <= 0) {
      return createSafeErrorResult(new Error("Max retries exceeded"));
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
    } catch (_error: unknown) {
      return attempt(retry, retriesLeft);
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
  async function retry(retriesLeft: number): Promise<SafeResult<boolean>> {
    if (retriesLeft <= 0) {
      return createSafeErrorResult(new Error("Max retries exceeded"));
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
    } catch (_error: unknown) {
      return attempt(retry, retriesLeft);
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
  async function retry(retriesLeft: number): Promise<SafeResult<boolean>> {
    if (retriesLeft <= 0) {
      return createSafeErrorResult(new Error("Max retries exceeded"));
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
    } catch (_error: unknown) {
      return attempt(retry, retriesLeft);
    }
  }

  return await retry(MAX_RETRIES);
}

export {
  createNewResourceService,
  deleteManyResourcesService,
  deleteResourceByIdService,
  getAllResourcesService,
  getResourceByFieldService,
  getResourceByIdService,
  getTotalResourcesService,
  updateResourceByIdService,
};
