"use client";

import { CheckCircle2, KeyRound, LockKeyhole, Mail, RefreshCcw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { SectionCard } from "@/components/section-card";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-[#e7decd] bg-cloud px-3.5 py-2.5 text-sm outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15";

function moveToNextPath(nextPath: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (!nextPath.startsWith("/")) {
    window.location.assign("/");
    return;
  }

  window.location.assign(nextPath);
}

function getBaseUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.origin;
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const resetDone = searchParams.get("reset") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(
    resetDone ? "パスワードを更新しました。新しいパスワードでログインしてください。" : null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();
  const baseUrl = useMemo(() => getBaseUrl(), []);

  const onSignIn = async () => {
    if (!supabase) {
      setErrorMessage("Supabase の設定がまだ完了していません。");
      return;
    }

    setIsPending(true);
    setErrorMessage(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMessage(error.message);
      setIsPending(false);
      return;
    }

    localStorage.removeItem("dailylog-store");
    moveToNextPath(nextPath);
  };

  const onSignUp = async () => {
    if (!supabase) {
      setErrorMessage("Supabase の設定がまだ完了していません。");
      return;
    }

    setIsPending(true);
    setErrorMessage(null);
    setMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: baseUrl
        ? {
            emailRedirectTo: `${baseUrl}/login`
          }
        : undefined
    });

    if (error) {
      setErrorMessage(error.message);
      setIsPending(false);
      return;
    }

    if (data.session) {
      localStorage.removeItem("dailylog-store");
      moveToNextPath(nextPath);
      return;
    }

    setMessage("確認メールを送信しました。メール内のリンクを開いてからログインしてください。");
    setIsPending(false);
  };

  const onResetPassword = async () => {
    if (!supabase) {
      setErrorMessage("Supabase の設定がまだ完了していません。");
      return;
    }

    if (!email) {
      setErrorMessage("先にメールアドレスを入力してください。");
      return;
    }

    setIsPending(true);
    setErrorMessage(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: baseUrl ? `${baseUrl}/reset-password` : undefined
    });

    if (error) {
      setErrorMessage(error.message);
      setIsPending(false);
      return;
    }

    setMessage("パスワード再設定メールを送信しました。受信したリンクから新しいパスワードを設定してください。");
    setIsPending(false);
  };

  const onResendConfirmation = async () => {
    if (!supabase) {
      setErrorMessage("Supabase の設定がまだ完了していません。");
      return;
    }

    if (!email) {
      setErrorMessage("確認メールを再送するため、メールアドレスを入力してください。");
      return;
    }

    setIsPending(true);
    setErrorMessage(null);
    setMessage(null);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: baseUrl
        ? {
            emailRedirectTo: `${baseUrl}/login`
          }
        : undefined
    });

    if (error) {
      setErrorMessage(error.message);
      setIsPending(false);
      return;
    }

    setMessage("確認メールを再送しました。受信ボックスと迷惑メールフォルダを確認してください。");
    setIsPending(false);
  };

  return (
    <div className="mx-auto max-w-[960px] space-y-4 py-1 sm:space-y-5">
      <SectionCard
        title="ログイン"
        description="DailyLog をアカウントごとに安全に使えるよう、ログイン・新規登録・再設定導線をひとつにまとめています。"
      >
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-[1.5rem] bg-moss p-5 text-white">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/70">Secure Access</p>
              <h2 className="mt-2 font-display text-[2rem] leading-tight">
                日報を、あなた専用の記録に。
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/80">
                メールアドレスとパスワードでログインすると、売上やメモをユーザーごとに分けて保存できます。
              </p>
              <div className="mt-5 rounded-[1.2rem] bg-white/10 p-4 text-sm leading-6 text-white/80">
                別の PC からログインしても、同じアカウントなら同じデータをそのまま続きから使えます。
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.35rem] bg-oat p-4 text-sm text-ink/75">
                <Mail className="h-4 w-4 text-moss" />
                <p className="mt-3 font-semibold text-ink">最初は新規登録</p>
                <p className="mt-2 leading-6">まだアカウントがない場合は、メールアドレスとパスワードを入れて登録します。</p>
              </div>
              <div className="rounded-[1.35rem] bg-oat p-4 text-sm text-ink/75">
                <CheckCircle2 className="h-4 w-4 text-moss" />
                <p className="mt-3 font-semibold text-ink">確認後にログイン</p>
                <p className="mt-2 leading-6">確認メールが届いた場合は、リンクを開いてからこの画面でログインしてください。</p>
              </div>
              <div className="rounded-[1.35rem] bg-oat p-4 text-sm text-ink/75">
                <KeyRound className="h-4 w-4 text-moss" />
                <p className="mt-3 font-semibold text-ink">忘れても再設定</p>
                <p className="mt-2 leading-6">メールアドレスが分かれば、そのまま再設定メールを送ってパスワードを更新できます。</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-[1.5rem] bg-oat p-5">
            {!isSupabaseConfigured() ? (
              <div className="rounded-[1.2rem] bg-white p-4 text-sm text-ink/75 ring-1 ring-oat">
                Supabase の公開キーがまだ設定されていません。Vercel または `.env.local` に環境変数を追加してください。
              </div>
            ) : null}

            <label className="block text-sm font-medium text-ink/75">
              メールアドレス
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-[18px] h-4 w-4 text-ink/45" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={`${inputClassName} pl-10`}
                  placeholder="name@example.com"
                />
              </div>
            </label>

            <label className="block text-sm font-medium text-ink/75">
              パスワード
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-[18px] h-4 w-4 text-ink/45" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${inputClassName} pl-10`}
                  placeholder="8文字以上を推奨"
                />
              </div>
            </label>

            {message ? <div className="rounded-xl bg-white px-4 py-3 text-sm text-[#1d4d45]">{message}</div> : null}
            {errorMessage ? <div className="rounded-xl bg-[#fff0ea] px-4 py-3 text-sm text-[#a14725]">{errorMessage}</div> : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  void onSignIn();
                }}
                disabled={isPending || !email || !password}
                className="inline-flex items-center rounded-full bg-moss px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isPending ? "処理中" : "ログイン"}
              </button>
              <button
                type="button"
                onClick={() => {
                  void onSignUp();
                }}
                disabled={isPending || !email || !password}
                className="inline-flex items-center rounded-full border border-[#d7cbb7] bg-white px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60"
              >
                新規登録
              </button>
            </div>

            <div className="grid gap-2 rounded-[1.2rem] bg-white/75 p-3 text-sm text-ink/75 ring-1 ring-[#e7decd]">
              <button
                type="button"
                onClick={() => {
                  void onResetPassword();
                }}
                disabled={isPending || !email}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d7cbb7] px-4 py-2 font-semibold text-ink disabled:opacity-60"
              >
                <KeyRound className="h-4 w-4" />
                パスワード再設定メールを送る
              </button>
              <button
                type="button"
                onClick={() => {
                  void onResendConfirmation();
                }}
                disabled={isPending || !email}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d7cbb7] px-4 py-2 font-semibold text-ink disabled:opacity-60"
              >
                <RefreshCcw className="h-4 w-4" />
                確認メールを再送する
              </button>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
