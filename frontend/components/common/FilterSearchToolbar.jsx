"use client";

import { ButtonUI, joinClassNames } from "./buttonUI.jsx";

/**
 * Component nhận vào:
 * - tabs: mảng nút lọc, mỗi phần tử có { key, label }.
 * - activeKey: key của nút lọc đang chọn.
 * - onTabChange: hàm nhận key mới khi người dùng bấm nút lọc.
 * - searchValue: giá trị ô tìm kiếm.
 * - onSearchChange: hàm nhận giá trị tìm kiếm mới.
 * - onSearchSubmit: hàm chạy khi bấm nút Tìm kiếm hoặc nhấn Enter.
 * - searchPlaceholder: placeholder của ô input.
 * - searchButtonLabel: chữ trên nút tìm kiếm.
 * - className: class bổ sung nếu page cần thêm khoảng cách riêng.
 * Component xử lý: gom nhóm nút lọc bên trái và nhóm tìm kiếm bên phải.
 * Component trả về: JSX toolbar responsive, tái sử dụng được cho users/rooms/lookup/report.
 */
export default function FilterSearchToolbar({
  tabs = [],
  activeKey,
  onTabChange,
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = "Tìm kiếm...",
  searchButtonLabel = "Tìm kiếm",
  className = "",
}) {
  function handleSearchSubmit(event) {
    event.preventDefault();

    if (onSearchSubmit) {
      onSearchSubmit(searchValue);
    }
  }

  return (
    <section className={joinClassNames("filterSearchToolbar", className)}>
      <div className="filterSearchToolbar__tabs" aria-label="Bộ lọc nhanh">
        {tabs.map((tabItem) => {
          const isActive = activeKey === tabItem.key;

          return (
            <ButtonUI
              key={tabItem.key}
              shape="pill"
              tone={isActive ? "primary" : "outline"}
              size="sm"
              active={isActive}
              className={joinClassNames(
                "filterSearchToolbar__tab",
                isActive
                  ? "filterSearchToolbar__tab--active"
                  : "filterSearchToolbar__tab--inactive",
              )}
              onClick={() => onTabChange?.(tabItem.key)}
              aria-pressed={isActive}
            >
              {tabItem.label}
            </ButtonUI>
          );
        })}
      </div>

      <form className="filterSearchToolbar__search" onSubmit={handleSearchSubmit}>
        <ButtonUI
          type="submit"
          tone="primary"
          shape="rounded"
          className="filterSearchToolbar__searchButton"
        >
          {searchButtonLabel}
        </ButtonUI>

        <input
          type="text"
          className="input filterSearchToolbar__input"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
        />
      </form>
    </section>
  );
}
