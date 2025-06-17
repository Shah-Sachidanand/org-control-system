import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import {
  CreditCard,
  DollarSign,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import axios from "axios";
import { Partner, PaymentStatus } from "../../types";
import { HttpClient } from "@/lib/axios";

interface PartnerPaymentProps {
  partner: Partner;
  onPaymentComplete: () => void;
}

export const PartnerPayment: React.FC<PartnerPaymentProps> = ({
  partner,
  onPaymentComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<
    "amount" | "payment" | "processing" | "complete"
  >("amount");
  const [paymentData, setPaymentData] = useState({
    amount: partner.sponsorshipDetails.budget || 0,
    currency: partner.sponsorshipDetails.currency || "USD",
  });
  const [paymentMethod, setPaymentMethod] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");

  const handleCreatePaymentIntent = async () => {
    setLoading(true);
    try {
      const response = await HttpClient.post(
        "/payments/create-payment-intent",
        {
          partnerId: partner._id,
          amount: paymentData.amount,
          currency: paymentData.currency,
        }
      );

      setClientSecret(response.data.clientSecret);
      setPaymentIntentId(response.data.paymentIntentId);
      setPaymentStep("payment");
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ?? "Failed to create payment intent"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    setLoading(true);
    setPaymentStep("processing");

    try {
      // Mock payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await HttpClient.post("/payments/confirm-payment", {
        paymentIntentId,
        paymentMethodId: "pm_mock_" + Date.now(),
      });

      if (response.data.success) {
        setPaymentStep("complete");
        toast.success("Payment processed successfully!");
        onPaymentComplete();
      } else {
        toast.error("Payment failed. Please try again.");
        setPaymentStep("payment");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Payment processing failed");
      setPaymentStep("payment");
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (partner.sponsorshipDetails.paymentStatus === "paid") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Payment Complete
          </CardTitle>
          <CardDescription>
            Sponsorship payment has been successfully processed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Amount Paid:
              </span>
              <span className="font-medium">
                {partner.sponsorshipDetails.paymentAmount?.toLocaleString()}{" "}
                {partner.sponsorshipDetails.currency}
              </span>
            </div>
            {partner.sponsorshipDetails.paidAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Paid On:</span>
                <span className="font-medium">
                  {new Date(
                    partner.sponsorshipDetails.paidAt
                  ).toLocaleDateString()}
                </span>
              </div>
            )}
            <Badge
              className={getPaymentStatusColor(
                partner.sponsorshipDetails.paymentStatus!
              )}
            >
              <div className="flex items-center gap-1">
                {getPaymentStatusIcon(
                  partner.sponsorshipDetails.paymentStatus!
                )}
                {partner.sponsorshipDetails.paymentStatus}
              </div>
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Sponsorship Payment
        </CardTitle>
        <CardDescription>
          Process payment for {partner.name} sponsorship
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paymentStep === "amount" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Sponsorship Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        amount: parseFloat(e.target.value),
                      }))
                    }
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={paymentData.currency}
                  onValueChange={(value) =>
                    setPaymentData((prev) => ({ ...prev, currency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium">Secure Payment</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your payment information is encrypted and secure. This
                sponsorship will activate the partner for promotional campaigns.
              </p>
            </div>

            <Button
              onClick={handleCreatePaymentIntent}
              disabled={loading || !paymentData.amount}
              className="w-full"
            >
              {loading
                ? "Processing..."
                : `Proceed to Payment - ${paymentData.amount.toLocaleString()} ${
                    paymentData.currency
                  }`}
            </Button>
          </div>
        )}

        {paymentStep === "payment" && (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Amount:</span>
                <span className="text-lg font-bold">
                  {paymentData.amount.toLocaleString()} {paymentData.currency}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  value={paymentMethod.cardholderName}
                  onChange={(e) =>
                    setPaymentMethod((prev) => ({
                      ...prev,
                      cardholderName: e.target.value,
                    }))
                  }
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  value={paymentMethod.cardNumber}
                  onChange={(e) =>
                    setPaymentMethod((prev) => ({
                      ...prev,
                      cardNumber: e.target.value,
                    }))
                  }
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    value={paymentMethod.expiryDate}
                    onChange={(e) =>
                      setPaymentMethod((prev) => ({
                        ...prev,
                        expiryDate: e.target.value,
                      }))
                    }
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    value={paymentMethod.cvv}
                    onChange={(e) =>
                      setPaymentMethod((prev) => ({
                        ...prev,
                        cvv: e.target.value,
                      }))
                    }
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPaymentStep("amount")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleProcessPayment}
                disabled={
                  loading ||
                  !paymentMethod.cardNumber ||
                  !paymentMethod.cardholderName
                }
                className="flex-1"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Now
              </Button>
            </div>
          </div>
        )}

        {paymentStep === "processing" && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Processing Payment</h3>
            <p className="text-muted-foreground">
              Please wait while we process your payment securely...
            </p>
          </div>
        )}

        {paymentStep === "complete" && (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground mb-4">
              Your sponsorship payment has been processed successfully.
            </p>
            <Badge className="bg-green-100 text-green-800">
              Partner Activated
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
