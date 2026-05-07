function renderCardIcon({
  IconComponent,
  iconComponent,
  iconNode,
  icon,
  iconSize,
  iconClassName,
}) {
  const ResolvedIconComponent =
    IconComponent ||
    iconComponent ||
    (typeof icon === "function" ? icon : null);
  const resolvedIconNode =
    iconNode || (typeof icon !== "function" ? icon : null);

  if (resolvedIconNode) {
    return resolvedIconNode;
  }

  if (!ResolvedIconComponent) {
    return null;
  }

  return <ResolvedIconComponent size={iconSize} className={iconClassName} />;
}

export function UploadCard({
  icon,
  iconSize = 20,
  iconWrapperSize = 40,
  iconColor = "#8b0000",
  iconWrapperColor = "rgba(139, 0, 0, 0.08)",
  title,
  titleColor = "#0f2750",
  titleSize = "17px",
  fileLabel,
  fileBackgroundColor = "#fffdfd",
  fileTextColor = "#8b0000",
  buttonLabel,
  buttonTextColor = "#ffffff",
  buttonBackgroundColor = "#7a0000",
  accept,
  disabled = false,
  inputName,
  onFileChange,
  onButtonClick,
  className = "",
}) {
  const iconContent = renderCardIcon({
    icon,
    iconSize,
    iconClassName: "uploadCardIconSvg",
  });
  const uploadCardClassName = ["card", "uploadCard", className]
    .filter(Boolean)
    .join(" ");
  const iconWrapperStyle = {
    width: iconWrapperSize,
    height: iconWrapperSize,
    backgroundColor: iconWrapperColor,
    color: iconColor,
  };
  const titleStyle = {
    color: titleColor,
    fontSize: titleSize,
  };
  const fileBoxStyle = {
    backgroundColor: fileBackgroundColor,
    color: fileTextColor,
  };
  const buttonStyle = {
    backgroundColor: buttonBackgroundColor,
    color: buttonTextColor,
  };

  return (
    <article className={uploadCardClassName}>
      <div className="uploadCardDiv1">
        <div className="uploadCardDiv11">
          {iconContent ? (
            <span className="uploadCardIconWrap" style={iconWrapperStyle}>
              {iconContent}
            </span>
          ) : null}
        </div>

        <div className="uploadCardDiv12">
          <h6 className="uploadCardTitle" style={titleStyle}>
            {title}
          </h6>
        </div>
      </div>

      <div className="uploadCardDiv2">
        <div className="uploadCardDiv21">
          <label
            className={disabled ? "uploadBox uploadBoxDisabled" : "uploadBox"}
            style={fileBoxStyle}
          >
            <input
              type="file"
              hidden
              accept={accept}
              name={inputName}
              disabled={disabled}
              onChange={onFileChange}
            />
            <span className="uploadBoxText">{fileLabel}</span>
          </label>
        </div>

        <div className="uploadCardDiv22">
          <button
            type="button"
            className="uploadBtn"
            style={buttonStyle}
            disabled={disabled}
            onClick={onButtonClick}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

export const CardCreateUpload = UploadCard;

export function CardUI({
  icon,
  iconSize = 20,
  iconWrapperSize = 40,
  iconColor = "#334155",
  iconWrapperColor = "rgba(139, 0, 0, 0.08)",
  title,
  number,
  numberSize = "28px",
  message,
  messageColor = "#64748b",
  messageSize = "12px",
  titleColor = "#334155",
  titleSize = "14px",
  className = "",
}) {
  const iconContent = renderCardIcon({
    icon,
    iconSize,
    iconClassName: "summaryCardIcon",
  });
  const cardClassName = ["accountSummaryCard", "summaryCard", className]
    .filter(Boolean)
    .join(" ");
  const iconWrapperStyle = {
    width: iconWrapperSize,
    height: iconWrapperSize,
    backgroundColor: iconWrapperColor,
    color: iconColor,
  };
  const titleStyle = {
    color: titleColor,
    fontSize: titleSize,
  };
  const messageStyle = {
    color: messageColor,
    fontSize: messageSize,
  };
  const numberStyle = {
    fontSize: numberSize,
  };

  return (
    <article className={cardClassName}>
      <div className="summaryCardDiv1">
        <div className="summaryCardDiv11">
          {iconContent ? (
            <span className="summaryCardIconWrap" style={iconWrapperStyle}>
              {iconContent}
            </span>
          ) : null}
        </div>

        <div className="summaryCardDiv12">
          <p className="summaryCardTitle" style={titleStyle}>
            {title}
          </p>
        </div>
      </div>

      <div className="summaryCardDiv2">
        {message ? (
          <p className="summaryCardMessage" style={messageStyle}>
            {message}
          </p>
        ) : null}
      </div>

      <div className="summaryCardDiv3">
        <h3 className="summaryCardNumber" style={numberStyle}>
          {number}
        </h3>
      </div>
    </article>
  );
}
