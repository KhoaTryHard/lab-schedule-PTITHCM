import { ButtonUI, joinClassNames } from "./buttonUI.jsx";

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

function CardFrame({ children, variant = "summary", className = "" }) {
  return (
    <article
      className={joinClassNames(
        "cardUIFrame",
        `cardUIFrame--${variant}`,
        className,
      )}
    >
      {children}
    </article>
  );
}

export function CardUI({
  icon,
  iconSize = 22,
  iconWrapperSize = 46,
  iconColor = "var(--app-role-primary, #334155)",
  iconWrapperColor = "var(--app-role-primary-soft, rgba(139, 0, 0, 0.08))",
  title,
  number,
  numberSize = "20px",
  message,
  messageColor = "#64748b",
  messageSize = "12px",
  titleColor = "#183b68",
  titleSize = "15px",
  className = "",
}) {
  const iconContent = renderCardIcon({
    icon,
    iconSize,
    iconClassName: "cardUIIconSvg",
  });
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
    <CardFrame variant="summary" className={className}>
      <div className="cardUISummaryHeader">
        {iconContent ? (
          <span className="cardUIIconWrap" style={iconWrapperStyle}>
            {iconContent}
          </span>
        ) : null}

        <div className="cardUISummaryHeading">
          <p className="cardUITitle" style={titleStyle}>
            {title}
          </p>
          {message ? (
            <p className="cardUIDescription" style={messageStyle}>
              {message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="cardUISummaryBody">
        <h3 className="cardUIValue" style={numberStyle}>
          {number}
        </h3>
      </div>
    </CardFrame>
  );
}

export function UploadCard({
  icon,
  iconSize = 20,
  iconWrapperSize = 46,
  iconColor = "var(--app-role-primary, #8b0000)",
  iconWrapperColor = "var(--app-role-primary-soft, rgba(139, 0, 0, 0.08))",
  title,
  titleColor = "#183b68",
  titleSize = "15px",
  fileLabel,
  buttonLabel,
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
    iconClassName: "cardUIIconSvg",
  });
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

  return (
    <CardFrame variant="upload" className={className}>
      <div className="cardUIUploadHeader">
        {iconContent ? (
          <span className="cardUIIconWrap" style={iconWrapperStyle}>
            {iconContent}
          </span>
        ) : null}

        <h6 className="cardUITitle cardUIUploadTitle" style={titleStyle}>
          {title}
        </h6>
      </div>

      <div className="cardUIUploadActions">
        <ButtonUI
          as="label"
          tone="outline"
          shape="pill"
          width="full"
          className={joinClassNames(
            "cardUIUploadFieldButton",
            disabled ? "cardUIUploadFieldButton--disabled" : "",
          )}
        >
          <input
            type="file"
            hidden
            accept={accept}
            name={inputName}
            disabled={disabled}
            onChange={onFileChange}
          />
          <span className="cardUIUploadFieldText">{fileLabel}</span>
        </ButtonUI>

        <ButtonUI
          tone="primary"
          shape="rounded"
          width="full"
          className="cardUIUploadActionButton"
          disabled={disabled}
          onClick={onButtonClick}
        >
          {buttonLabel}
        </ButtonUI>
      </div>
    </CardFrame>
  );
}

export const CardCreateUpload = UploadCard;

export function ActionCard({
  icon = "PT",
  title,
  description,
  primaryText = "Thực hiện",
  onPrimaryClick,
  secondaryText,
  onSecondaryClick,
  uploadLabel,
  disabled = false,
  className = "",
}) {
  return (
    <CardFrame variant="action" className={className}>
      <div className="cardUIActionHeader">
        <span className="cardUIActionIcon">{icon}</span>
        <div className="cardUIActionHeading">
          <h3 className="cardUIActionTitle">{title}</h3>
          {description ? (
            <p className="cardUIActionText">{description}</p>
          ) : null}
        </div>
      </div>

      {uploadLabel ? (
        <ButtonUI
          as="label"
          tone="outline"
          shape="pill"
          width="full"
          className={joinClassNames(
            "cardUIUploadFieldButton",
            disabled ? "cardUIUploadFieldButton--disabled" : "",
          )}
        >
          {uploadLabel}
          <input type="file" hidden disabled={disabled} />
        </ButtonUI>
      ) : null}

      <div className="cardUIActionFooter">
        {primaryText ? (
          <ButtonUI
            tone="primary"
            shape="rounded"
            disabled={disabled}
            onClick={onPrimaryClick}
          >
            {primaryText}
          </ButtonUI>
        ) : null}
        {secondaryText ? (
          <ButtonUI
            tone="secondary"
            shape="rounded"
            disabled={disabled}
            onClick={onSecondaryClick}
          >
            {secondaryText}
          </ButtonUI>
        ) : null}
      </div>
    </CardFrame>
  );
}
