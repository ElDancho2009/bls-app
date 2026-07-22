function DefaultIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path
        d="M12 8L15.8 10.8L14.3 15.2H9.7L8.2 10.8Z M12 8L12 5.5 M15.8 10.8L18.2 10.1 M14.3 15.2L15.8 17.2 M9.7 15.2L8.2 17.2 M8.2 10.8L5.8 10.1"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function EmptyState({ icon = <DefaultIcon />, title, subtitle }) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      {subtitle && <div className="empty-state-subtitle">{subtitle}</div>}
    </div>
  );
}
