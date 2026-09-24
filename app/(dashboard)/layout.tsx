import { AppSidebar } from "@/components/app-sidebar"
import { CommandSearch } from "@/components/command-search"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { requireUser } from "@/lib/auth"
import { listClientSummaries } from "@/lib/data/clients"

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const { email } = await requireUser()
  const clients = await listClientSummaries()

  return (
    <SidebarProvider>
      <AppSidebar email={email} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4!" />
          <div className="flex-1">
            <CommandSearch clients={clients} />
          </div>
          <ThemeToggle />
        </header>
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
