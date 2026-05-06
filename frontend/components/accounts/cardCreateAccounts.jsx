export function CardCreateAccounts({ NameCard }) {
  return (
    <li className="uploadCard">
      <h6 className="uploadCardTitle">{NameCard}</h6>

      <label className="uploadBox">
        <input type="file" hidden />
        <span className="uploadBoxText">Tải file excel</span>
      </label>

      <button type="button" className="uploadBtn">
        Tải lên
      </button>
    </li>
  );
}

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
