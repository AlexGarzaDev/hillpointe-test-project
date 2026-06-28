import { useEffect, useMemo, useState } from 'react'

function App() {
  const [apiName, setApiName] = useState<string>('')
  const [apiVersion, setApiVersion] = useState<string>('')
  const [isLoadingVersion, setIsLoadingVersion] = useState<boolean>(true)
  const [versionError, setVersionError] = useState<string>('')

  const apiStatusLabel = useMemo(() => {
    if (isLoadingVersion) {
      return 'Checking API health...'
    }

    if (versionError) {
      return 'Backend unreachable'
    }

    return 'Backend connected'
  }, [isLoadingVersion, versionError])

  useEffect(() => {
    const abortController = new AbortController()

    const fetchVersion = async (): Promise<void> => {
      try {
        setIsLoadingVersion(true)
        setVersionError('')

        const response = await fetch('/version', {
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`Version request failed with ${response.status}`)
        }

        const payload = (await response.json()) as {
          name?: string
          version?: string
        }

        setApiName(payload.name ?? 'Unknown API')
        setApiVersion(payload.version ?? 'N/A')
      } catch (error) {
        if (abortController.signal.aborted) {
          return
        }

        setVersionError(
          error instanceof Error
            ? error.message
            : 'Unexpected error while loading version',
        )
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingVersion(false)
        }
      }
    }

    void fetchVersion()

    return () => {
      abortController.abort()
    }
  }, [])

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--canvas)] text-[var(--ink)]">
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-[var(--accent)]/25 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[var(--signal)]/20 blur-3xl" />

      <section className="mx-auto flex min-h-screen w-full max-w-6xl items-center p-6 md:p-10">
        <div className="grid w-full gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-[var(--border)] bg-white/85 p-7 shadow-[0_20px_80px_-30px_rgba(11,18,46,0.35)] backdrop-blur md:p-10">
            <p className="mb-5 inline-flex rounded-full border border-[var(--border)] bg-white px-4 py-1 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              React + Vite + Tailwind
            </p>

            <h1 className="mb-4 font-[family-name:var(--font-display)] text-4xl leading-tight md:text-6xl">
              Project Launch Dashboard
            </h1>

            <p className="mb-8 max-w-xl text-base text-[var(--muted)] md:text-lg">
              Frontend scaffolded with Vite, styled with Tailwind, and connected
              to your existing Express endpoints.
            </p>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                API status
              </p>
              <p className="mt-2 text-xl font-semibold">{apiStatusLabel}</p>

              <p className="mt-3 text-sm text-[var(--muted)]">
                {versionError
                  ? versionError
                  : `${apiName || 'Hillpointe API'} v${apiVersion || '--'}`}
              </p>
            </div>
          </article>

          <aside className="rounded-3xl border border-[var(--border)] bg-[var(--ink)] p-7 text-white shadow-[0_24px_90px_-35px_rgba(0,0,0,0.65)] md:p-10">
            <h2 className="mb-2 font-[family-name:var(--font-display)] text-2xl md:text-3xl">
              Next steps
            </h2>
            <p className="mb-6 text-sm text-white/70">
              Your project is ready for feature development with a single unified workflow.
            </p>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.08em] text-white/70">
                  Development
                </p>
                <p className="mt-2 text-sm">Run <code className="rounded bg-black/20 px-1 py-0.5">npm run dev</code> to start backend and frontend together.</p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.08em] text-white/70">
                  Production
                </p>
                <p className="mt-2 text-sm">Run <code className="rounded bg-black/20 px-1 py-0.5">npm run prod</code> to build and serve the app from one process.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

export default App
