import { Link } from "@tanstack/react-router";
import { Calendar as CalendarIcon } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Toaster } from "@/components/ui/sonner";
import { NotificationsBell } from "@/components/NotificationsBell";


export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
      <SidebarProvider>
        <Toaster />
        <div className="flex min-h-screen w-full bg-background">
          <AdminSidebar />
          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur">
              <SidebarTrigger />
              <div className="ml-2 flex flex-1 items-center justify-between">
                <Link
                  to="/calendar"
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent/20 hover:text-foreground"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                </Link>
                <div className="flex items-center gap-3">
                  
                  <NotificationsBell />
                  <div className="h-8 w-8 rounded-full bg-vibrant shadow-vibrant" />
                </div>
              </div>
            </header>
            <main className="flex-1 px-6 py-8 lg:px-10">
              <div className="mx-auto max-w-6xl">{children}</div>
            </main>
          </div>
        </div>
      </SidebarProvider>
  );
}
