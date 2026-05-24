function StateIcon({ children }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-grid",
        placeItems: "center",
        width: 42,
        height: 42,
        borderRadius: 16,
        background: "rgba(139, 0, 0, 0.08)",
        fontSize: 22,
      }}
    >
      {children}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{
        display: "grid",
        gap: 8,
        width: "min(520px, 100%)",
        marginTop: 4,
      }}
    >
      {[80, 96, 68].map((widthPercent) => (
        <span
          key={widthPercent}
          style={{
            display: "block",
            width: `${widthPercent}%`,
            height: 10,
            borderRadius: 999,
            background:
              "linear-gradient(90deg, rgba(139,0,0,0.08), rgba(139,0,0,0.16), rgba(139,0,0,0.08))",
          }}
        />
      ))}
    </div>
  );
}

function DefaultRetryButton({ onRetry, label = "Thử lại" }) {
  function handleRetry() {
    if (typeof onRetry === "function") {
      onRetry();
      return;
    }

    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }

  return (
    <button
      type="button"
      className="buttonUI buttonUI--secondary buttonUI--sm"
      onClick={handleRetry}
    >
      {label}
    </button>
  );
}

export function LoadingState({
  title = "Đang tải dữ liệu...",
  description = "Vui lòng chờ trong giây lát.",
}) {
  return (
    <div className="commonStateBox" role="status" aria-live="polite">
      <StateIcon>⏳</StateIcon>
      <h3 className="commonStateTitle">{title}</h3>
      <p className="commonStateText">{description}</p>
      <LoadingSkeleton />
    </div>
  );
}

export function EmptyState({
  title = "Chưa có dữ liệu",
  description = "Dữ liệu sẽ hiển thị tại đây sau khi được tạo hoặc tải từ API.",
  action = null,
  icon = "📭",
}) {
  return (
    <div className="commonStateBox">
      <StateIcon>{icon}</StateIcon>
      <h3 className="commonStateTitle">{title}</h3>
      <p className="commonStateText">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Không thể tải dữ liệu",
  error,
  action,
  onRetry,
  retryLabel = "Thử lại",
  showRetry = true,
}) {
  const resolvedAction =
    action ??
    (showRetry ? (
      <DefaultRetryButton onRetry={onRetry} label={retryLabel} />
    ) : null);

  return (
    <div className="commonStateBox" role="alert">
      <StateIcon>⚠️</StateIcon>
      <h3 className="commonStateTitle">{title}</h3>
      <p className="commonStateText">
        {error?.message || error || "Đã có lỗi xảy ra."}
      </p>
      {resolvedAction}
    </div>
  );
}
