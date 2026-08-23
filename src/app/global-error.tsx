"use client";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#f7f3ec",
          color: "#241f18",
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <title>حدث خطأ غير متوقع</title>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <section
            style={{
              width: "100%",
              maxWidth: 520,
              textAlign: "center",
              border: "1px solid #e0d4c2",
              borderRadius: 8,
              background: "#fffaf3",
              padding: 32,
              boxShadow: "0 20px 50px rgba(36, 31, 24, 0.08)",
            }}
          >
            <h1 style={{ margin: "0 0 12px", fontSize: 28, fontWeight: 800 }}>
              حدث خطأ غير متوقع
            </h1>
            <p style={{ margin: "0 0 24px", color: "#6e6254", lineHeight: 1.8 }}>
              تعذر تحميل الصفحة. حاول مرة أخرى.
            </p>
            {error.digest ? (
              <p
                style={{
                  margin: "0 0 24px",
                  color: "#8a7c6a",
                  fontSize: 13,
                  direction: "ltr",
                }}
              >
                {error.digest}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => retry()}
              style={{
                minHeight: 44,
                border: 0,
                borderRadius: 8,
                background: "#d49a20",
                color: "#17130e",
                cursor: "pointer",
                fontWeight: 800,
                padding: "0 22px",
              }}
            >
              إعادة المحاولة
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
