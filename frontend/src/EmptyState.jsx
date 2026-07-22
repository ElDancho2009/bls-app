export default function EmptyState({ icon = '⚽', title }) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
    </div>
  );
}
