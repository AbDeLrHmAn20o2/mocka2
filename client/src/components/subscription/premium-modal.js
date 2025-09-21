"use client";

import { useEditorStore } from "@/store";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import {
  Crown,
  Download,
  Loader2,
  Sparkles,
  X,
  Shield,
  Infinity,
  Star,
  Calendar,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  createPaypalSubscription,
  SUBSCRIPTION_CONFIG,
} from "@/services/subscription-service";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getSubscriptionStatus } from "@/lib/premium-utils";

function SubscriptionModal({ isOpen, onClose }) {
  const { userSubscription } = useEditorStore();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState("features");
  const subscriptionStatus = getSubscriptionStatus(userSubscription);

  useEffect(() => {
    if (isOpen) {
      setPaymentStep("features");
    }
  }, [isOpen]);

  const handleUpgradeClick = () => {
    setPaymentStep("payment");
  };

  const handlePayPalPayment = async () => {
    setIsLoading(true);
    setPaymentStep("processing");

    try {
      const response = await createPaypalSubscription();

      if (response?.success && response?.data?.approvalLink) {
        localStorage.setItem("pendingUpgrade", "true");
        window.location.href = response.data.approvalLink;
      } else {
        throw new Error(response?.message || "Failed to create PayPal order");
      }
    } catch (error) {
      console.error("PayPal payment error:", error);
      toast.error("Payment Error", {
        description: "Failed to initiate PayPal payment. Please try again.",
      });
      setPaymentStep("payment");
    } finally {
      setIsLoading(false);
    }
  };

  const premiumFeatures = [
    {
      icon: <Crown className="h-6 w-6 text-yellow-500" />,
      title: "Premium Templates",
      description: "Access to 500+ premium templates and growing library",
      highlight: true,
    },
    {
      icon: <Download className="h-6 w-6 text-blue-500" />,
      title: "Advanced Export",
      description: "Export in PNG, JPG, PDF, SVG with high resolution",
      highlight: true,
    },
    {
      icon: <Infinity className="h-6 w-6 text-purple-500" />,
      title: "Unlimited Designs",
      description: "Create unlimited designs without restrictions",
      highlight: true,
    },
  ];

  if (userSubscription?.isPremium) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-800 mb-2">
              You're Premium! 🎉
            </DialogTitle>
            <p className="text-gray-600 mb-6">
              Thanks for being a premium member. Enjoy all the exclusive
              features!
            </p>

            <div className="bg-white rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  Premium since{" "}
                  {new Date(
                    userSubscription?.premiumSince
                  ).toLocaleDateString() || "Recently"}
                </span>
              </div>
              {userSubscription?.nextBillingDate && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-2">
                  <span>
                    Next billing:{" "}
                    {new Date(
                      userSubscription.nextBillingDate
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <Button onClick={onClose} className="w-full">
              Continue Creating
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogTitle className="sr-only">
          Upgrade to Premium Subscription
        </DialogTitle>
        <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold mb-2">
              {subscriptionStatus.isRenewal
                ? "Renew Your Premium"
                : "Upgrade to Premium"}
            </h2>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-4xl font-bold">
                ${SUBSCRIPTION_CONFIG.price}
              </span>
              <span className="text-lg opacity-80">/month</span>
            </div>
            <p className="text-lg opacity-90">
              {subscriptionStatus.isRenewal
                ? "Continue enjoying premium features with monthly billing"
                : "Unlock unlimited creativity with premium features"}
            </p>
            {subscriptionStatus.status === "expired" && (
              <p className="text-yellow-200 text-sm mt-2 bg-white/10 px-3 py-1 rounded-lg inline-block">
                ⚠️ Your premium subscription has expired
              </p>
            )}
          </div>
        </div>

        {paymentStep === "features" && (
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {premiumFeatures.map((feature, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
                    feature.highlight
                      ? "bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">{feature.icon}</div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                  {feature.highlight && (
                    <Star className="h-5 w-5 text-purple-500 flex-shrink-0 mt-1" />
                  )}
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Monthly Billing Details
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Billed monthly on the same date you subscribe</li>
                <li>• Cancel anytime - no long-term commitment</li>
                <li>• Instant access to all premium features</li>
                <li>• Secure payment processing via PayPal</li>
              </ul>
            </div>

            <Button
              onClick={handleUpgradeClick}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6"
            >
              <Crown className="h-5 w-5 mr-2" />
              {subscriptionStatus.isRenewal
                ? "Renew Premium Subscription"
                : "Start Premium Subscription"}
            </Button>

          </div>
        )}

        {paymentStep === "payment" && (
          <div className="p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Complete Your Purchase
              </h3>
              <p className="text-gray-600">
                You'll be redirected to PayPal to complete your $
                {SUBSCRIPTION_CONFIG.price}/month subscription
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h4 className="font-semibold text-gray-800 mb-4">
                Order Summary
              </h4>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Premium Subscription</span>
                <span className="font-semibold">
                  ${SUBSCRIPTION_CONFIG.price}.00/month
                </span>
              </div>
              <div className="border-t pt-2 mt-4">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span>${SUBSCRIPTION_CONFIG.price}.00/month</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePayPalPayment}
              disabled={isLoading}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 mb-4"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <span className="mr-2">💳</span>
              )}
              Pay with PayPal
            </Button>

            <div className="flex gap-4">
              <Button
                onClick={() => setPaymentStep("features")}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
            </div>
          </div>
        )}

        {paymentStep === "processing" && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Processing Payment...
            </h3>
            <p className="text-gray-600 mb-4">
              You're being redirected to PayPal to complete your subscription.
            </p>
            <p className="text-sm text-gray-500">
              Please don't close this window.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default SubscriptionModal;
