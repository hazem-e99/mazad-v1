import { useToastStore } from "@/hooks/useToast";

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiFailure {
  ok: false;
  code: string;
  message: string;
  /** Per-input messages keyed by field path, from the server's schema. */
  fieldErrors?: Record<string, string>;
  issues?: unknown[];
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiClientError extends Error {
  code: string;
  /** Populated for 422 responses so a form can mark the exact inputs the
   * server rejected, instead of showing one undifferentiated banner. */
  fieldErrors: Record<string, string>;

  constructor(code: string, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export interface ApiFetchOptions extends RequestInit {
  /** Suppress the automatic error toast. Forms that surface the failure
   * inline (and raise their own, more specific toast) set this so the
   * user is not told the same thing twice. */
  silentErrors?: boolean;
}

export async function apiFetch<T>(input: string, init?: ApiFetchOptions): Promise<T> {
  const { silentErrors, ...requestInit } = init ?? {};
  try {
    const isFormData = requestInit.body instanceof FormData;
    const res = await fetch(input, {
      ...requestInit,
      headers: isFormData ? requestInit.headers : { "Content-Type": "application/json", ...requestInit.headers },
      credentials: "same-origin",
    });

    const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;

    if (!res.ok || !body || !body.ok) {
      const message = body && !body.ok ? body.message : "حدث خطأ غير متوقع";
      const code = body && !body.ok ? body.code : "unknown_error";
      throw new ApiClientError(code, message, (body && !body.ok && body.fieldErrors) || {});
    }

    return body.data;
  } catch (err) {
    const error = err instanceof ApiClientError ? err : new ApiClientError("network_error", "تعذر الاتصال بالخادم");
    if (!silentErrors) useToastStore.getState().push(error.message, "error");
    throw error;
  }
}
