import { Icon } from './Icon'
export function EmptyState({ kind, title, description }: {
  kind: 'calendar' | 'mail'; title: string; description: string
}) {
  return <div className="empty-state px-5 py-[58px] text-center [&_h3]:text-xl [&_h3]:font-[550] [&_h3]:tracking-[-.5px] [&_p]:mx-auto [&_p]:mt-[11px] [&_p]:max-w-[390px] [&_p]:text-sm [&_p]:leading-[1.8] [&_p]:wrap-anywhere [&_p]:text-[#627753] max-md:px-0 max-md:[&_p]:text-[13px]"><span className="empty-icon mb-[18px] inline-grid size-[58px] place-items-center rounded-[17px] bg-[#eef3e8] text-[#69825a]"><Icon name={kind} size={28} /></span>
    <h3>{title}</h3><p>{description}</p></div>
}
