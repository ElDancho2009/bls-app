function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ListRow({
  icon,
  title,
  subtitle,
  badge,
  badgeTone = 'neutral',
  chevron = true,
  onClick,
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className="list-row" onClick={onClick}>
      {icon && <span className="list-row-icon">{icon}</span>}
      <span className="list-row-body">
        <span className="list-row-title">{title}</span>
        {subtitle && <span className="list-row-subtitle">{subtitle}</span>}
      </span>
      {badge && <span className={`list-row-badge list-row-badge-${badgeTone}`}>{badge}</span>}
      {chevron && onClick && <span className="list-row-chevron"><ChevronIcon /></span>}
    </Tag>
  );
}
