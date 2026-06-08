import { DockviewReact, DockviewReadyEvent, IDockviewPanelProps } from 'dockview-react'
import 'dockview-react/dist/styles/dockview.css'

const MyPanel = (props: IDockviewPanelProps) => {
  return <div style={{ padding: 16 }}>{props.api.title}</div>
}

const components = { default: MyPanel }

function App() {
  const onReady = (event: DockviewReadyEvent) => {
    event.api.addPanel({ id: 'panel_1', component: 'default', title: 'Panel 1' })
    event.api.addPanel({
      id: 'panel_2',
      component: 'default',
      title: 'Panel 2',
      position: { referencePanel: 'panel_1', direction: 'right' },
    })
  }

  return (
    <DockviewReact
      className="dockview-theme-abyss w-full h-full"
      onReady={onReady}
      components={components}
    />
  )
}
export default App
