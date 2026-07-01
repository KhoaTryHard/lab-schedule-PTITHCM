export function PageHeader({ eyebrow, title, description, actions = null }) {
  return (
    <header className="commonPageHeader">
      <div className="commonPageHeaderBody">
        {eyebrow ? <p className="commonEyebrow">{eyebrow}</p> : null}
        <h2 className="commonTitle">{title}</h2>
        {description ? <p className="commonDescription">{description}</p> : null}
      </div>
      {actions ? <div className="commonHeaderActions">{actions}</div> : null}
    </header>
  );
}

export function Panel({ children, className = "" }) {
  return <section className={`commonPanel ${className}`}>{children}</section>;
}

export function Grid({ children, columns = 3 }) {
  const gridClass =
    columns === 4 ? "commonGrid4" : columns === 2 ? "commonGrid2" : "commonGrid3";
  return <div className={`commonGrid ${gridClass}`}>{children}</div>;
}
