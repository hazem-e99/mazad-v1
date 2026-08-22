"use client";

import { useCallback, useRef, useState } from "react";
import type { RefObject } from "react";
import type { ZodType } from "zod";
import { useToastStore } from "@/hooks/useToast";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { ApiClientError } from "@/lib/api-client";
import { buildSchemas, translatorFor, type Schemas, type Translate } from "@/lib/validation";

export type FieldErrors = Record<string, string>;

/** Form-wide messages live under this key so they can be rendered as a
 * banner without colliding with any real field name. */
export const FORM_ERROR_KEY = "_form";

interface ValidateOptions {
  /** Which "please fix things" toast to raise. Defaults to the submit
   * wording; step transitions pass the continue wording. */
  toastKey?: "fixBeforeContinue" | "fixBeforeSubmit";
  /** Suppress the toast entirely (e.g. validating silently on blur). */
  silent?: boolean;
}

/**
 * Client-side validation against the very same Zod schemas the API uses,
 * built with the current page locale so every message is in the language
 * on screen.
 *
 * Errors land in three places at once, which is what the brief asks for:
 * beside the input (via `errorFor`), on the input itself (aria-invalid,
 * from the shared Field component), and in a toast naming the first
 * concrete problem — never a bare "something went wrong".
 */
export function useFormValidation(formRef?: RefObject<HTMLFormElement | null>) {
  const { t, locale } = useTranslations();
  const push = useToastStore((s) => s.push);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Rebuilt only when the locale changes; buildSchemas is cheap but there
  // is no reason to recreate every schema on each render.
  const schemaCache = useRef<{ locale: string; schemas: Schemas } | null>(null);
  if (!schemaCache.current || schemaCache.current.locale !== locale) {
    schemaCache.current = { locale, schemas: buildSchemas(translatorFor(locale)) };
  }
  const schemas = schemaCache.current.schemas;

  const translate = useCallback<Translate>((key, params) => t(key, params), [t]);

  const focusField = useCallback(
    (field: string) => {
      const form = formRef?.current;
      if (!form || field === FORM_ERROR_KEY) return;
      const escaped = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(field) : field;
      const el = form.querySelector<HTMLElement>(
        `[name="${escaped}"], [data-field="${escaped}"]`
      );
      el?.focus({ preventScroll: false });
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    },
    [formRef]
  );

  const clearAll = useCallback(() => setErrors({}), []);

  const clearField = useCallback((field: string) => {
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setFieldError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  /** Reports the given errors: inline state + focus + one toast naming the
   * first problem. Returns the errors so callers can branch on them. */
  const report = useCallback(
    (fieldErrors: FieldErrors, options: ValidateOptions = {}) => {
      setErrors(fieldErrors);
      const entries = Object.entries(fieldErrors);
      if (entries.length === 0) return fieldErrors;

      const [firstField, firstMessage] = entries[0];
      if (!options.silent) {
        // The most specific reason available beats the generic prompt;
        // the generic one is only a fallback for an empty message.
        push(firstMessage || t("validation." + (options.toastKey ?? "fixBeforeSubmit")), "error");
      }
      focusField(firstField);
      return fieldErrors;
    },
    [focusField, push, t]
  );

  /**
   * Validates `values` and returns the parsed data, or null if invalid
   * (having already surfaced the errors). Callers simply do:
   *   const data = validate(schemas.loginSchema, values);
   *   if (!data) return;
   */
  const validate = useCallback(
    <T,>(schema: ZodType<T>, values: unknown, options: ValidateOptions = {}): T | null => {
      const result = schema.safeParse(values);
      if (result.success) {
        setErrors({});
        return result.data;
      }
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path.length ? issue.path.map(String).join(".") : FORM_ERROR_KEY;
        if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
      }
      report(fieldErrors, options);
      return null;
    },
    [report]
  );

  /**
   * Maps a rejected API call onto the form. A 422 carries per-field
   * messages from the server's copy of the schema; anything else is a
   * form-level condition (conflict, permission, network) and is shown as
   * a banner plus a toast carrying the server's own wording.
   */
  const applyApiError = useCallback(
    (err: unknown, fallbackMessage?: string) => {
      if (err instanceof ApiClientError) {
        if (Object.keys(err.fieldErrors).length > 0) {
          report(err.fieldErrors, { silent: true });
          push(Object.values(err.fieldErrors)[0], "error");
          return err.message;
        }
        setErrors({ [FORM_ERROR_KEY]: err.message });
        push(err.message, "error");
        return err.message;
      }
      const message = fallbackMessage ?? t("common.error");
      setErrors({ [FORM_ERROR_KEY]: message });
      push(message, "error");
      return message;
    },
    [push, report, t]
  );

  const errorFor = useCallback((field: string) => errors[field], [errors]);

  /** Spread onto an Input/Select/Textarea: wires the name (used for focus)
   * and the inline error in one go. */
  const fieldProps = useCallback(
    (field: string) => ({ name: field, error: errors[field] }),
    [errors]
  );

  return {
    schemas,
    t: translate,
    errors,
    errorFor,
    fieldProps,
    formError: errors[FORM_ERROR_KEY],
    validate,
    report,
    applyApiError,
    setFieldError,
    clearField,
    clearAll,
    hasErrors: Object.keys(errors).length > 0,
  };
}
