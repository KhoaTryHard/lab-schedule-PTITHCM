/**
 * Hàm nhận vào: IconComponent là icon React component tùy chọn, iconNode là JSX icon tùy chọn, NameCard là tên loại dữ liệu cần hiển thị.
 * Hàm xử lý: dựng thẻ upload với phần đầu gồm icon và tên nằm ngang, bên dưới là ô tải file và nút tải lên.
 * Hàm trả về: JSX của một card upload dùng chung cho nhiều màn hình quản trị.
 */
export function CardCreateUpload({ IconComponent, iconNode, NameCard }) {
  return (
    <li className="uploadCard">
      <div className="uploadCardHeader">
        <span className="uploadCardIcon">
          {iconNode ? (
            iconNode
          ) : IconComponent ? (
            <IconComponent size={22} className="uploadCardIconSvg" />
          ) : null}
        </span>
        <h6 className="uploadCardTitle">{NameCard}</h6>
      </div>
      <div className="uploadClick">
        <label className="uploadBox">
          <input type="file" hidden />
          <span className="uploadBoxText">Tải file excel</span>
        </label>

        <button type="button" className="uploadBtn">
          Tải lên
        </button>
      </div>
    </li>
  );
}

/**
 * Hàm nhận vào: IconComponent là icon React component, nameCard là tiêu đề card, numbers là số liệu cần hiển thị.
 * Hàm xử lý: dựng card thống kê nhỏ dùng chung cho các màn hình quản trị.
 * Hàm trả về: JSX của card thống kê.
 */
export function CardUI({ IconComponent, nameCard, numbers }) {
  return (
    <div className="accountSummaryCard">
      <div>
        <IconComponent size={28} className="accountIcon" />
      </div>

      <p>{nameCard}</p>
      <h3>{numbers}</h3>
    </div>
  );
}
