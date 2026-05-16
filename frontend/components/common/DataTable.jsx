import { EmptyState, ErrorState, LoadingState } from "./UiState";

export default function DataTable({
  columns = [],
  rows = [],
  rowKey = "id",
  loading = false,
  error = null,
  emptyTitle = "Chưa có dữ liệu",
  emptyDescription = "Chưa có bản ghi phù hợp với bộ lọc hiện tại.",
}) {
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="commonTableWrap">
      <table className="commonTable">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row[rowKey] || rowIndex}>
              {columns.map((column) => {
                const rawValue = row[column.key];
                const content = column.render
                  ? column.render(rawValue, row, rowIndex)
                  : rawValue;

                return <td key={column.key}>{content ?? "—"}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
