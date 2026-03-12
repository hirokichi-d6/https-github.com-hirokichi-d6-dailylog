"use client";

import { LogOut, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type AuthStatusProps = {
  email: string | null;
};

function navigateToLogin() {
  if (typeof window !== "undefined") {
    window.location.assign("/login");
  }
}

export function AuthStatus({ email }: AuthStatusProps) {
  const [isPending, setIsPending] = useState(false);

  const onSignOut = async () => {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      navigateToLogin();
      return;
    }

    setIsPending(true);

    try {
      await supabase.auth.signOut();
      localStorage.removeItem("dailylog-store");
      navigateToLogin();
    } finally {
      setIsPending(false);
    }
  };

  if (!email) {
    return (
      <div className="mt-6 rounded-[1.35rem] bg-oat p-4 text-sm text-ink/80">
        <p className="font-semibold text-ink">ログイン</p>
        <p className="mt-2 leading-6">
          ログインすると、売上や記録を自分のアカウントに保存して使えます。
        </p>
        <a
          href="/login"
          className="mt-3 inline-flex rounded-full bg-moss px-4 py-2 text-sm font-semibold text-white"
        >
          ログインへ
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-[1.35rem] bg-oat p-4 text-sm text-ink/80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink">アカウント</p>
          <p className="mt-2 break-all leading-6">{email}</p>
        </div>
        <ShieldCheck className="mt-0.5 h-4 w-4 text-moss" />
      </div>
      <button
        type="button"
        onClick={() => {
          void onSignOut();
        }}
        disabled={isPending}
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#d7cbb7] px-3 py-2 text-xs font-semibold text-ink disabled:opacity-60"
      >
        <LogOut className="h-3.5 w-3.5" />
        {isPending ? "ログアウト中" : "ログアウト"}
      </button>
    </div>
  );
}
