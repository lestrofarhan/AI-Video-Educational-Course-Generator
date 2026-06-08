import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 text-zinc-900 selection:bg-blue-500/10">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto w-full max-w-md",
            card: "w-full border border-zinc-200/80 bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl",
            headerTitle:
              "text-2xl font-extrabold tracking-tight text-zinc-900 font-sans",
            headerSubtitle: "text-sm font-medium text-zinc-500",
            socialButtonsBlockButton:
              "border border-zinc-200/80 bg-white hover:bg-zinc-50 text-zinc-800 font-semibold shadow-xs rounded-lg h-10 transition-all active:scale-[0.99]",
            socialButtonsBlockButtonText: "font-semibold text-zinc-700 text-xs",
            dividerLine: "bg-zinc-100",
            dividerText:
              "text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400 bg-white px-2",
            formLabel: "text-xs font-semibold tracking-wide text-zinc-600",
            formInput:
              "w-full h-10 bg-zinc-50/50 border border-zinc-200 rounded-lg px-3 text-[14px] text-zinc-800 placeholder-zinc-400 outline-none focus:border-zinc-300 focus:ring-0 transition-all font-medium",
            formButtonPrimary:
              "flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#1a73e8] hover:bg-[#155cb4] text-white text-xs font-semibold uppercase tracking-wider transition-all active:scale-[0.99] shadow-sm cursor-pointer",
            footerActionText: "text-xs font-medium text-zinc-500",
            footerActionLink:
              "text-xs font-semibold text-[#2563eb] hover:text-[#155cb4] transition-colors underline decoration-transparent hover:decoration-current underline-offset-4",
          },
        }}
        fallbackRedirectUrl={"/"}
      />
    </div>
  );
}
