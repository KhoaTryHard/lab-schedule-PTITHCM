"use client";

import { useEffect, useMemo, useState } from "react";

import Pagination from "./Pagination.jsx";
import { EmptyState, ErrorState, LoadingState } from "./UiState";

export default function DataTable({
  columns = [],
  rows = [],
  rowKey = "id",
  loading = false,
  error = null,
  emptyTitle = "Chưa có dữ liệu",
  emptyDescription = "Chưa có bản ghi phù hợp với bộ lọc hiện tại.",
  pageSize = 10,
  enablePagination = true,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const safePageSize = Math.max(1, Number(pageSize) || 10);
  const totalPages = Math.max(1, Math.ceil(rows.length / safePageSize));
  const shouldShowPagination = enablePagination && rows.length > safePageSize;

  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length, safePageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    if (!shouldShowPagination) {
      return rows;
    }

    const startIndex = (currentPage - 1) * safePageSize;
    return rows.slice(startIndex, startIndex + safePageSize);
  }, [currentPage, rows, safePageSize, shouldShowPagination]);

  const rowIndexOffset = shouldShowPagination
    ? (currentPage - 1) * safePageSize
    : 0;

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
    <div className="dataTableBlock">
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
            {paginatedRows.map((row, visibleRowIndex) => {
              const absoluteRowIndex = rowIndexOffset + visibleRowIndex;

              return (
                <tr key={row[rowKey] || absoluteRowIndex}>
                  {columns.map((column) => {
                    const rawValue = row[column.key];
                    const content = column.render
                      ? column.render(rawValue, row, absoluteRowIndex)
                      : rawValue;

                    return <td key={column.key}>{content ?? "—"}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {shouldShowPagination ? (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={rows.length}
          pageSize={safePageSize}
          onPageChange={setCurrentPage}
        />
      ) : null}
    </div>
  );
}
