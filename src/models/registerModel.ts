import { deleteModel, model, models, type Model, type Schema } from "mongoose";

/**
 * Registers a Mongoose model, healing the stale-model case that Next's dev
 * server otherwise produces.
 *
 * Mongoose keeps compiled models in a process-global registry. Next's dev
 * server keeps that process alive across HMR reloads, so a model compiled
 * from an earlier revision of a schema file outlives edits to that file —
 * `models.X ?? model("X", schema)` then keeps handing back the *old*
 * compiled model and the new schema is silently discarded. The symptom is
 * a runtime error about a field that is plainly present in the source
 * (`StrictPopulateError: Cannot populate path 'category' because it is not
 * in your schema`), curable only by restarting the server.
 *
 * So: reuse the cached model while its compiled paths still match the
 * schema being registered, and recompile when they have drifted. Comparing
 * paths rather than recompiling unconditionally keeps unrelated HMR
 * reloads from needlessly rebuilding indexes. In production the module
 * evaluates once and this is always a plain first registration.
 */
export function registerModel<T>(name: string, schema: Schema): Model<T> {
  const cached = models[name] as Model<T> | undefined;
  if (!cached) return model<T>(name, schema);

  const cachedPaths = Object.keys(cached.schema.paths).sort().join(",");
  const currentPaths = Object.keys(schema.paths).sort().join(",");
  if (cachedPaths === currentPaths) return cached;

  deleteModel(name);
  return model<T>(name, schema);
}
