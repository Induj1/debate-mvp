import AuthForm from "@/components/AuthForm";
import DebateMatch from "@/components/DebateMatch";
import UserProfile from "@/components/UserProfile";
import DebateHistory from "@/components/DebateHistory";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold tracking-tight">Debate</h1>
        </div>
      </header>
      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-8">
        <section className="flex flex-col items-center gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Account
          </h2>
          <AuthForm />
        </section>
        <section className="flex flex-col items-center gap-2">
          <UserProfile />
        </section>
        <section className="flex flex-col items-center gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Lobby
          </h2>
          <DebateMatch />
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            History
          </h2>
          <DebateHistory />
        </section>
      </main>
    </div>
  );
}
