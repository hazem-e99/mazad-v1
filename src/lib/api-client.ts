import { useToastStore } from "@/hooks/useToast";

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiFailure {
  ok: false;
  code: string;
  message: string;
  issues?: unknown[];
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiClientError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  try {
    const isFormData = init?.body instanceof FormData;
    const res = await fetch(input, {
      ...init,
      headers: isFormData ? init?.headers : { "Content-Type": "application/json", ...init?.headers },
      credentials: "same-origin",
    });

    const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;

    if (!res.ok || !body || !body.ok) {
      const message = body && !body.ok ? body.message : "حدث خطأ غير متوقع";
      const code = body && !body.ok ? body.code : "unknown_error";
      throw new ApiClientError(code, message);
    }

    return body.data;
  } catch (err) {
    const error = err instanceof ApiClientError ? err : new ApiClientError("network_error", "تعذر الاتصال بالخادم");
    useToastStore.getState().push(error.message, "error");
    throw error;
  }
}
