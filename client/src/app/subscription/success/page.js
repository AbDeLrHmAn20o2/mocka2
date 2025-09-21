"use client";

import { capturePaypalOrder } from "@/services/subscription-service";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function SubscriptionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("processing");

  useEffect(() => {
    const orderId = searchParams.get("token");

    const processPayment = async () => {
      try {
        const response = await capturePaypalOrder(orderId);

        if (response.success) {
          router.push("/");
        }
      } catch (e) {
        setStatus("error");
      }
    };

    processPayment();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
        {status === "processing" && (
          <div className="flex flex-col items-center text-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <h1 className="text-2xl font-bold mb-2">Processing Payment</h1>
            <p className="text-muted-foreground mb-4">
              Please wait while we confirm your payment
            </p>
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold mb-2 text-red-600">Payment Error</h1>
            <p className="text-muted-foreground mb-4">
              There was an error processing your payment. Please try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SubscriptionSuccess() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <h1 className="text-2xl font-bold mb-2">Loading...</h1>
            <p className="text-muted-foreground mb-4">
              Please wait while we load your payment details
            </p>
          </div>
        </div>
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}

export default SubscriptionSuccess;
