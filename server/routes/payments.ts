import express, { Response } from "express";
import { authenticate, authorize } from "../middleware/auth";
import Partner from "../models/Partner";

const router = express.Router();

// Create payment intent for partner sponsorship
router.post(
  "/create-payment-intent",
  authenticate,
  authorize("ORGADMIN", "ADMIN", "SUPERADMIN"),
  async (req: any, res: Response) => {
    try {
      const { partnerId, amount, currency = "USD" } = req.body;

      // Validate partner exists and user has access
      const partner = await Partner.findById(partnerId);
      if (!partner) {
        return res.status(404).json({ error: "Partner not found" });
      }

      // Check organization access
      const currentUser = req.user;
      if (
        currentUser.role !== "SUPERADMIN" &&
        partner.organizationId !== currentUser.organization._id.toString()
      ) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Mock payment intent creation (replace with actual Stripe integration)
      const paymentIntent = {
        id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        client_secret: `pi_${Date.now()}_secret_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        amount: amount * 100, // Convert to cents
        currency: currency.toLowerCase(),
        status: "requires_payment_method",
      };

      // Update partner with payment intent
      partner.sponsorshipDetails.paymentIntentId = paymentIntent.id;
      partner.sponsorshipDetails.paymentAmount = amount;
      partner.sponsorshipDetails.paymentStatus = "pending";
      await partner.save();

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Confirm payment for partner sponsorship
router.post(
  "/confirm-payment",
  authenticate,
  async (req: any, res: Response) => {
    try {
      const { paymentIntentId, paymentMethodId } = req.body;

      // Find partner by payment intent
      const partner = await Partner.findOne({
        "sponsorshipDetails.paymentIntentId": paymentIntentId,
      });

      if (!partner) {
        return res.status(404).json({ error: "Payment intent not found" });
      }

      // Mock payment confirmation (replace with actual Stripe confirmation)
      const paymentConfirmed = Math.random() > 0.1; // 90% success rate for demo

      if (paymentConfirmed) {
        partner.sponsorshipDetails.paymentStatus = "paid";
        partner.sponsorshipDetails.paymentMethod = paymentMethodId;
        partner.sponsorshipDetails.paidAt = new Date();
        partner.status = "active";
      } else {
        partner.sponsorshipDetails.paymentStatus = "failed";
      }

      await partner.save();

      res.json({
        success: paymentConfirmed,
        partner: partner,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get payment status
router.get(
  "/payment-status/:partnerId",
  authenticate,
  async (req: any, res: Response) => {
    try {
      const partner = await Partner.findById(req.params.partnerId);
      if (!partner) {
        return res.status(404).json({ error: "Partner not found" });
      }

      res.json({
        paymentStatus: partner.sponsorshipDetails.paymentStatus,
        paymentAmount: partner.sponsorshipDetails.paymentAmount,
        paidAt: partner.sponsorshipDetails.paidAt,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
