export function LoadingState({ title = "Đang tải dữ liệu...", description = "Vui lòng chờ trong giây lát." }) {
  return (
    <div className="commonStateBox" role="status" aria-live="polite">
      <h3 className="commonStateTitle">{title}</h3>
      <p className="commonStateText">{description}</p>
    </div>
  );
}

export function EmptyState({ title = "Chưa có dữ liệu", description = "Dữ liệu sẽ hiển thị tại đây sau khi được tạo hoặc tải từ API.", action = null }) {
  return (
    <div className="commonStateBox">
      <h3 className="commonStateTitle">{title}</h3>
      <p className="commonStateText">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ title = "Không thể tải dữ liệu", error, action = null }) {
  return (
    <div className="commonStateBox" role="alert">
      <h3 className="commonStateTitle">{title}</h3>
      <p className="commonStateText">{error?.message || error || "Đã có lỗi xảy ra."}</p>
      {action}
    </div>
  );
}
