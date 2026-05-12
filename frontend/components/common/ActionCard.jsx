import styles from "./common.module.css";

export default function ActionCard({
  icon = "PT",
  title,
  description,
  primaryText = "Thực hiện",
  onPrimaryClick,
  secondaryText,
  onSecondaryClick,
  uploadLabel,
  disabled = false,
}) {
  return (
    <article className={styles.actionCard}>
      <div className={styles.actionCardHeader}>
        <span className={styles.actionIcon}>{icon}</span>
        <div>
          <h3 className={styles.actionTitle}>{title}</h3>
          {description ? <p className={styles.actionText}>{description}</p> : null}
        </div>
      </div>

      {uploadLabel ? <label className={styles.uploadBox}>{uploadLabel}<input type="file" hidden /></label> : null}

      <div className={styles.actionFooter}>
        {primaryText ? (
          <button type="button" className="button" disabled={disabled} onClick={onPrimaryClick}>
            {primaryText}
          </button>
        ) : null}
        {secondaryText ? (
          <button type="button" className="button secondary" disabled={disabled} onClick={onSecondaryClick}>
            {secondaryText}
          </button>
        ) : null}
      </div>
    </article>
  );
}
