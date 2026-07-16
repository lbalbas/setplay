import { createFileRoute } from '@tanstack/react-router'
import StreamGrid from '#/components/StreamGrid'
import FeaturedHero from '#/components/FeaturedHero'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="w-11/12 mx-auto max-w-screen-2xl">
      <FeaturedHero />
      <StreamGrid />
    </main>
  )
}
