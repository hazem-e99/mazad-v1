import { Types } from "mongoose";

/**
 * Core primitives for the Server Component -> Client Component
 * serialization boundary. Mongoose's `.lean()` strips document methods but
 * leaves real `ObjectId` and `Date` instances in the result — those are not
 * plain objects, so React refuses to pass them as props into a "use client"
 * component ("Only plain objects can be passed to Client Components...").
 * Every model-specific mapper in this directory builds on these two
 * converters instead of relying on `.lean()` alone or on `as unknown as`
 * casts, which only satisfy the type checker and do nothing at runtime.
 */

export function idToString(id: unknown): string {
  if (id instanceof Types.ObjectId) return id.toString();
  if (typeof id === "string") return id;
  // Defensive fallback for any object exposing a Mongo-style toString
  // (covers edge cases like a populated doc's _id passed in directly).
  return String(id);
}

export function dateToISOString(date: unknown): string {
  if (date instanceof Date) return date.toISOString();
  if (typeof date === "string") return date;
  throw new Error(`dateToISOString: expected a Date or ISO string, got ${typeof date}`);
}

export function nullableDateToISOString(date: unknown): string | null {
  if (date == null) return null;
  return dateToISOString(date);
}

/**
 * A populated Mongoose ref field is either left as a raw ObjectId (not
 * populated) or replaced with the nested lean document (populated). This
 * narrows which case we're in so mappers can branch without repeating the
 * `instanceof Types.ObjectId` check everywhere.
 */
export function isPopulated<T extends object>(value: T | Types.ObjectId | null | undefined): value is T {
  return value != null && !(value instanceof Types.ObjectId) && typeof value === "object";
}
