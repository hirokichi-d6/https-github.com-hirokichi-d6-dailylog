"use client";

import { LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { SectionCard } from "@/components/section-card";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-[#e7decd] bg-cloud px-3.5 py-2.5 text-sm outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15";

function moveToLogin() {
  if (typeof window !== "undefined") {
    window.location.assign("/login?reset=1");
  }
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let cancelled = false;

    const applySessionState = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.session) {
        setIsReady(true);
        setMessage(null);
        return;
      }

      setMessage("再設定メールから開いた場合にだけ、この画面で新しいパスワードを設定できます。");
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" || Boolean(session)) {
        setIsReady(true);
        setMessage(null);
      }
    });

    void applySessionState();

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const onSubmit = async () => {
    if (!supabase) {
      setErrorMessage("Supabase の設定がまだ完了していません。");
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage("新しいパスワードは8文字以上で入力してください。");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("確認用パスワードが一致していません。");
      return;
    }

    setIsPending(true);
    setMessage(null);
    setErrorMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMessage(error.message);
      setIsPending(false);
      return;
    }

    await supabase.auth.signOut();
    localStorage.removeItem("dailylog-store");
    moveToLogin();
  };

  return (
    <div className="mx-auto max-w-[640px] space-y-4 py-1 sm:space-y-5">
      <SectionCard
        title="パスワード再設定"
        description="メールから開いたあと、この画面で新しいパスワードに更新できます。"
      >
        <div className="rounded-[1.5rem] bg-oat p-5">
          {!isSupabaseConfigured() ? (
            <div className="rounded-xl bg-white px-4 py-3 text-sm text-ink/75">
              Supabase の設定がまだ完了していません。
            </div>
          ) : null}

          {message ? <div className="rounded-xl bg-white px-4 py-3 text-sm text-[#1d4d45]">{message}</div> : null}
          {errorMessage ? <div className="rounded-xl bg-[#fff0ea] px-4 py-3 text-sm text-[#a14725]">{errorMessage}</div> : null}

          <div className="mt-4 grid gap-4">
            <label className="block text-sm font-medium text-ink/75">
              新しいパスワード
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-[18px] h-4 w-4 text-ink/45" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${inputClassName} pl-10`}
                  placeholder="8文字以上を推奨"
                  disabled={!isReady || isPending}
                />
              </div>
            </label>

            <label className="block text-sm font-medium text-ink/75">
              新しいパスワード（確認）
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-[18px] h-4 w-4 text-ink/45" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={`${inputClassName} pl-10`}
                  placeholder="もう一度入力してください"
                  disabled={!isReady || isPending}
                />
              </div>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void onSubmit();
              }}
              disabled={!isReady || isPending || !password || !confirmPassword}
              className="inline-flex items-center rounded-full bg-moss px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isPending ? "更新中" : "新しいパスワードに更新"}
            </button>
            <a
              href="/login"
              className="inline-flex items-center rounded-full border border-[#d7cbb7] bg-white px-4 py-2 text-sm font-semibold text-ink"
            >
              ログインへ戻る
            </a>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
