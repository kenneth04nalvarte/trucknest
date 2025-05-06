"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const steps = [
  { key: "profile", label: "Complete your profile" },
  { key: "property", label: "Add your first property" },
  { key: "payout", label: "Set up payout method" },
  { key: "verify", label: "Verify your identity/business" },
];

export default function PropertyOwnerOnboarding() {
  const [completed, setCompleted] = useState<string[]>([]);
  const router = useRouter();

  const handleComplete = (key: string) => {
    setCompleted((prev) => [...prev, key]);
  };

  const handleSkip = (key: string) => {
    setCompleted((prev) => [...prev, key]);
  };

  const allDone = completed.length === steps.length;

  if (allDone) {
    setTimeout(() => router.push("/dashboard"), 1000);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-2xl font-bold mb-4">Onboarding Complete!</div>
        <div className="text-gray-600 mb-2">Redirecting to your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-8 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-4 text-center">Welcome to TruckNest!</h1>
        <p className="text-gray-600 mb-6 text-center">Let's get your property listed and start earning.</p>
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-blue-600 rounded-full" style={{ width: `${(completed.length / steps.length) * 100}%` }}></div>
            </div>
            <span className="ml-4 text-sm text-gray-500">{completed.length}/{steps.length} complete</span>
          </div>
        </div>
        <ul className="space-y-4">
          {steps.map((step) => (
            <li key={step.key} className={`flex items-center justify-between p-4 rounded-lg border ${completed.includes(step.key) ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
              <span className={completed.includes(step.key) ? "line-through text-green-700" : "text-gray-800"}>{step.label}</span>
              {!completed.includes(step.key) && (
                <div className="flex gap-2">
                  <button className="btn-primary px-3 py-1 text-sm" onClick={() => handleComplete(step.key)}>Mark as Done</button>
                  <button className="btn-secondary px-3 py-1 text-sm" onClick={() => handleSkip(step.key)}>Skip</button>
                </div>
              )}
              {completed.includes(step.key) && <span className="text-green-600 font-bold">✓</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 