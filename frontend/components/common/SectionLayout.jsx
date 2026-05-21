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
  const wrapperClassName = ["sectionLayout", className]
    .filter(Boolean)
    .join(" ");
  const contentLayoutClassName = [
    "sectionLayoutContent",
    isVertical ? "sectionLayoutContentColumn" : "sectionLayoutContentRow",
    contentClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={wrapperClassName}>
      {title || message ? (
        <div className="sectionLayoutHeader">
          {title ? <h5 className="sectionLayoutTitle">{title}</h5> : null}
          {message ? <p className="sectionLayoutMessage">{message}</p> : null}
        </div>
      ) : null}

      <div className={contentLayoutClassName}>{children}</div>
    </section>
  );
}
