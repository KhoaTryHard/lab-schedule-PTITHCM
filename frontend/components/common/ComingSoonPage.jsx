import { EmptyState } from "./UiState.jsx";

export default function ComingSoonPage({
  title,
  description = "Tính năng này đã được khôi phục trên sidebar để giữ luồng điều hướng, nhưng backend/API chưa hoàn thiện. Tạm thời giữ trạng thái Sprint 2 để không làm vỡ giao diện.",
  icon = "🚧",
}) {
  return (
    <div className="adminPageStack">
      <section className="card">
        <EmptyState title={title} description={description} icon={icon} />
      </section>
    </div>
  );
}
