import { createFileRoute } from '@tanstack/react-router'
import { MOCK_STREAMS } from '#/mocks/data'
import StreamCard from '#/components/StreamCard'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="w-9/12 mx-auto">
      <section className="h-full mt-4 gap-4 w-full grid grid-cols-3">
        {MOCK_STREAMS.map((stream) => (
          <StreamCard key={stream.id} stream={stream} />
        ))}
      </section>
    </main>
  )
}
