import { DockviewReact, DockviewReadyEvent, IDockviewPanelProps } from 'dockview-react'
import type { DockviewApi } from 'dockview-core'
import 'dockview-react/dist/styles/dockview.css'
import { TitleBar } from './components/TitleBar'
import { SettingsPanel } from './components/panels/SettingsPanel'
import { AboutPanel } from './components/panels/AboutPanel'
import { useRef, useState } from 'react'
import { PanelLeft, PanelBottom, PanelRight } from 'lucide-react'

const MyPanel = (props: IDockviewPanelProps) => {
  return <div style={{ padding: 16 }}>{props.api.title}</div>
}

const components = {
  default: MyPanel,
  settings: SettingsPanel,
  about: AboutPanel,
}

function App() {
  const apiRef = useRef<DockviewApi | null>(null)
  const [panelVisibility, setPanelVisibility] = useState({
    left: true,
    bottom: true,
    right: true,
  })

  const onReady = (event: DockviewReadyEvent) => {
    apiRef.current = event.api
    event.api.addPanel({ id: 'panel_1', component: 'default', title: 'Panel 1' })
    event.api.addPanel({
      id: 'panel_2',
      component: 'default',
      title: 'Panel 2',
      position: { referencePanel: 'panel_1', direction: 'right' },
    })
    event.api.addEdgeGroup('left', { id: 'left-edge', initialSize: 200 })
    event.api.addEdgeGroup('bottom', { id: 'bottom-edge', initialSize: 150 })
    event.api.addEdgeGroup('right', { id: 'right-edge', initialSize: 200 })
  }

  const handleMenuAction = (action: string) => {
    const api = apiRef.current
    if (!api) return

    if (action === 'settings') {
      const existing = api.getPanel('settings')
      if (existing) {
        existing.api.setActive()
      } else {
        api.addPanel({ id: 'settings', component: 'settings', title: '设置' })
      }
    } else if (action === 'about') {
      const existing = api.getPanel('about')
      if (existing) {
        existing.api.setActive()
      } else {
        api.addPanel({
          id: 'about',
          component: 'about',
          title: '关于',
          floating: true,
        })
      }
    }
  }

  const handlePanelToggle = (id: string) => {
    const api = apiRef.current
    if (!api) return

    const position = id as 'left' | 'bottom' | 'right'
    const isVisible = api.isEdgeGroupVisible(position)

    api.setEdgeGroupVisible(position, !isVisible)
    setPanelVisibility((prev) => ({ ...prev, [id]: !isVisible }))
  }

  const panelItems = [
    { id: 'left', icon: <PanelLeft size={14} />, visible: panelVisibility.left },
    { id: 'bottom', icon: <PanelBottom size={14} />, visible: panelVisibility.bottom },
    { id: 'right', icon: <PanelRight size={14} />, visible: panelVisibility.right },
  ]

  return (
    <div className="flex flex-col h-screen">
      <TitleBar
        title="dawn-term"
        onMenuAction={handleMenuAction}
        panels={panelItems}
        onPanelToggle={handlePanelToggle}
      />
      <DockviewReact
        className="dockview-theme-abyss flex-1"
        onReady={onReady}
        components={components}
      />
    </div>
  )
}
export default App
