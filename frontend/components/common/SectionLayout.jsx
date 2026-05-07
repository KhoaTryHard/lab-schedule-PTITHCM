import styles from "./SectionLayout.module.css";

/**
 * direction: 0 = horizontal, 1 = vertical
 */
export default function SectionLayout({
  title,
  message,
  direction = 0,
  children,
  className = "",
  contentClassName = "",
}) {
  const isVertical = Number(direction) === 1;
  const wrapperClassName = [styles.sectionLayout, className]
    .filter(Boolean)
    .join(" ");
  const contentLayoutClassName = [
    styles.content,
    isVertical ? styles.contentColumn : styles.contentRow,
    contentClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={wrapperClassName}>
      {title || message ? (
        <div className={styles.header}>
          {title ? <h5 className={styles.title}>{title}</h5> : null}
          {message ? <p className={styles.message}>{message}</p> : null}
        </div>
      ) : null}

      <div className={contentLayoutClassName}>{children}</div>
    </section>
  );
}
