"use client";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Bell } from "lucide-react";
import { useSession } from "next-auth/react";

export function Topbar({ title }: { title: string }) {
  const { data: session } = useSession();

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5">
      <h1 className="text-base font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100">
          <Bell size={17} />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <span className="text-sm text-slate-600">{session?.user?.name}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut size={15} />
        </Button>
      </div>
    </header>
  );
}
