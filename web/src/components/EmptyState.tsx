import { Icon } from './Icon'
export function EmptyState({ kind, title, description }: {
  kind: 'calendar' | 'mail'; title: string; description: string
}) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={kind} size={28} /></span>
    <h3>{title}</h3><p>{description}</p></div>
}
