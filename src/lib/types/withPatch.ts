/**
 * Returns a copy of a model instance with some fields replaced, keeping its
 * class so getters and methods still work. Use it for optimistic store
 * updates; model constructors only accept database rows.
 */
export function withPatch<T extends object>(instance: T, patch: NoInfer<Partial<T>>): T {
  return Object.assign(Object.create(Object.getPrototypeOf(instance)), instance, patch);
}
