import { PanelLeft, PanelBottom, PanelRight } from 'lucide-react'

interface PanelItem {
  id: string
  icon: React.ReactNode
  visible: boolean
}

interface PanelToggleProps {
  panels: PanelItem[]
  onToggle: (id: string) => void
}

export function PanelToggle({ panels, onToggle }: PanelToggleProps) {
  return (
    <div className="panel-toggle">
      {panels.map((panel) => (
        <button
          key={panel.id}
          className={`panel-toggle-btn ${panel.visible ? 'panel-toggle-active' : 'panel-toggle-inactive'}`}
          onClick={() => onToggle(panel.id)}
        >
          {panel.icon}
        </button>
      ))}
    </div>
  )
}
