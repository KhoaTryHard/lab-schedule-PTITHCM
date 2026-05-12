import styles from "./common.module.css";

export function PageHeader({ eyebrow, title, description, actions = null }) {
  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeaderBody}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h2 className={styles.title}>{title}</h2>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {actions ? <div className={styles.headerActions}>{actions}</div> : null}
    </header>
  );
}

export function Panel({ children, className = "" }) {
  return <section className={`${styles.panel} ${className}`}>{children}</section>;
}

export function Grid({ children, columns = 3 }) {
  const gridClass = columns === 4 ? styles.grid4 : columns === 2 ? styles.grid2 : styles.grid3;
  return <div className={`${styles.grid} ${gridClass}`}>{children}</div>;
}
