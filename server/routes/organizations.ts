import express, { Request, Response } from "express";
import Organization from "../models/Organization";
import { authenticate, authorize } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = express.Router();

// Get all organizations (ADMIN and SUPERADMIN only)
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "SUPERADMIN"),
  async (req: any, res: Response) => {
    try {
      const currentUser = req.user;
      let filter = {};

      // ADMIN can only see organizations they created
      if (currentUser.role === "ADMIN") {
        filter = { createdBy: currentUser._id };
      }
      // SUPERADMIN can see all organizations

      const organizations = await Organization.find(filter).populate(
        "createdBy",
        "firstName lastName email"
      );

      res.json({ organizations });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create organization
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "SUPERADMIN"),
  async (req: any, res: Response) => {
    try {
      const { name, description, features } = req.body;

      const slug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");

      const organization = new Organization({
        name,
        slug,
        description,
        features: features ?? [],
        createdBy: req?.user?._id,
      });

      await organization.save();

      const populatedOrg = await Organization.findById(
        organization._id
      ).populate("createdBy", "firstName lastName email");

      res.status(201).json({ organization: populatedOrg });
    } catch (error: unknown) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "An unknown error occurred" });
      }
    }
  }
);

// Get organization by ID
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const organization = await Organization.findById(req.params.id).populate(
      "createdBy",
      "firstName lastName email"
    );

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Check if user has access to this organization
    if (req?.user?.role === "ADMIN") {
      // ADMIN can only access organizations they created
      if (organization?.createdBy?.toString() !== req?.user?._id.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else if (req?.user?.role === "ORGADMIN") {
      // ORGADMIN can only access their own organization
      if (
        !req.user.organization ||
        req.user.organization._id.toString() !== req.params.id
      ) {
        return res.status(403).json({ error: "Access denied" });
      }
    }
    // SUPERADMIN has access to all organizations

    res.json({ organization });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unknown error occurred" });
    }
  }
});

// Update organization features
router.put(
  "/:id/features",
  authenticate,
  authorize("ORGADMIN", "ADMIN", "SUPERADMIN"),
  async (req: any, res: Response) => {
    try {
      const { features } = req.body;

      const organization = await Organization.findById(req.params.id);
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Check permissions
      if (req?.user?.role === "ADMIN") {
        // ADMIN can only update organizations they created
        if (organization.createdBy.toString() !== req.user._id.toString()) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.user.role === "ORGADMIN") {
        // ORGADMIN can only update their own organization
        if (
          !req.user.organization ||
          req.user.organization._id.toString() !== req.params.id
        ) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      // SUPERADMIN can update any organization

      organization.features = features;
      await organization.save();

      res.json({ organization });
    } catch (error: unknown) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "An unknown error occurred" });
      }
    }
  }
);

export default router;
