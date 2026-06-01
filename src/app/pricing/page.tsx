import { PricingTable } from "@clerk/nextjs";
import Header from "@/app/_components/Header";

export default function PricingPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen  text-white flex flex-col items-center justify-center p-6">
        <div className="text-center mb-10 max-w-xl">
          <h1 className="text-4xl font-extrabold text-black tracking-tight mb-3">
            Upgrade Your <span className="text-[#2563eb]">Plan</span>
          </h1>
          <p className="text-zinc-400 text-sm">
            Unlock unlimited AI video generations, high-fidelity slides, and
            premium voices.
          </p>
        </div>

        {/* Clerk's native component handles the plans, pricing, and Stripe redirect */}
        <div className="w-full max-w-5xl">
          <div
            style={{
              maxWidth: "800px",
              margin: "0 auto",
              padding: "0 1rem",
              display: "flex",
            }}
          >
            <PricingTable />
          </div>
        </div>
      </div>
    </>
  );
}
