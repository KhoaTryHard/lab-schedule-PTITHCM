"use client";

import { useEffect, useMemo, useState } from "react";

function clampPage(page, totalPages) {
  const parsedPage = Number(page);

  if (!Number.isInteger(parsedPage)) {
    return 1;
  }

  if (parsedPage < 1) {
    return 1;
  }

  if (parsedPage > totalPages) {
    return totalPages;
  }

  return parsedPage;
}

function buildVisiblePages(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
}) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = clampPage(currentPage, safeTotalPages);
  const [pageInput, setPageInput] = useState(String(safeCurrentPage));
  const [inputError, setInputError] = useState("");

  const visiblePages = useMemo(
    () => buildVisiblePages(safeCurrentPage, safeTotalPages),
    [safeCurrentPage, safeTotalPages],
  );

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  useEffect(() => {
    setPageInput(String(safeCurrentPage));
    setInputError("");
  }, [safeCurrentPage]);

  function goToPage(nextPage) {
    const resolvedPage = clampPage(nextPage, safeTotalPages);

    if (resolvedPage !== safeCurrentPage) {
      onPageChange?.(resolvedPage);
    }
  }

  function handleInputChange(event) {
    const nextValue = event.target.value;

    if (!/^\d*$/.test(nextValue)) {
      return;
    }

    setPageInput(nextValue);
    setInputError("");
  }

  function handleInputKeyDown(event) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    const parsedPage = Number(pageInput);

    if (
      !Number.isInteger(parsedPage) ||
      parsedPage < 1 ||
      parsedPage > safeTotalPages
    ) {
      setInputError(`Nhập số trang từ 1 đến ${safeTotalPages}.`);
      return;
    }

    setInputError("");
    goToPage(parsedPage);
  }

  return (
    <div className="paginationBlock">
      <div className="paginationMeta">
        Hiển thị {startItem}–{endItem} trong {totalItems} dòng
      </div>

      <nav className="paginationControls" aria-label="Phân trang dữ liệu">
        <button
          type="button"
          className="paginationButton"
          onClick={() => goToPage(1)}
          disabled={safeCurrentPage === 1}
          aria-label="Về trang đầu"
        >
          |&lt;
        </button>

        {visiblePages.map((pageItem, index) =>
          pageItem === "..." ? (
            <span className="paginationEllipsis" key={`ellipsis-${index}`}>
              ...
            </span>
          ) : (
            <button
              type="button"
              key={pageItem}
              className={
                pageItem === safeCurrentPage
                  ? "paginationButton paginationButtonActive"
                  : "paginationButton"
              }
              onClick={() => goToPage(pageItem)}
              aria-current={pageItem === safeCurrentPage ? "page" : undefined}
            >
              {pageItem}
            </button>
          ),
        )}

        <button
          type="button"
          className="paginationButton"
          onClick={() => goToPage(safeTotalPages)}
          disabled={safeCurrentPage === safeTotalPages}
          aria-label="Đến trang cuối"
        >
          &gt;|
        </button>
      </nav>

      <label className="paginationJump">
        <span>Đến trang</span>
        <input
          className={
            inputError
              ? "paginationInput paginationInputError"
              : "paginationInput"
          }
          value={pageInput}
          inputMode="numeric"
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          aria-invalid={Boolean(inputError)}
          aria-describedby={inputError ? "paginationInputErrorText" : undefined}
        />
      </label>

      {inputError ? (
        <p className="paginationErrorText" id="paginationInputErrorText">
          {inputError}
        </p>
      ) : null}
    </div>
  );
}
