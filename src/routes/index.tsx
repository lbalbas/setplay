import { createFileRoute } from '@tanstack/react-router'
import StreamGrid from '#/components/StreamGrid'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="w-9/12 mx-auto">
      <StreamGrid />
    </main>
  )
}
