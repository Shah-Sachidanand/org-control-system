import express, { Request, Response } from "express";
import Organization from "../models/Organization";
import { authenticate, authorize, checkAdminOrganizationAccess, checkOrganizationAccess } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = express.Router();

// Get all organizations - Enhanced access control
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "SUPERADMIN"),
  async (req: any, res: Response) => {
    try {
      const currentUser = req.user;
      let filter = {};

      // SUPERADMIN can see all organizations
      if (currentUser.role === "SUPERADMIN") {
        // No filter - see all organizations
      } else if (currentUser.role === "ADMIN") {
        // ADMIN can only see organizations they created
        filter = { createdBy: currentUser._id };
      } else {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      const organizations = await Organization.find(filter)
        .populate("createdBy", "firstName lastName email")
        .sort({ createdAt: -1 });

      res.json({ organizations });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create organization - Enhanced validation
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "SUPERADMIN"),
  async (req: any, res: Response) => {
    try {
      const { name, description, features } = req.body;
      const currentUser = req.user;

      // Validate required fields
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Organization name is required" });
      }

      const slug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");

      // Check if slug already exists
      const existingOrg = await Organization.findOne({ slug });
      if (existingOrg) {
        return res.status(400).json({ error: "Organization with this name already exists" });
      }

      const organization = new Organization({
        name: name.trim(),
        slug,
        description: description?.trim() || "",
        features: features ?? [],
        createdBy: currentUser._id,
      });

      await organization.save();

      const populatedOrg = await Organization.findById(organization._id)
        .populate("createdBy", "firstName lastName email");

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

// Get organization by ID - Enhanced access control
router.get("/:id", authenticate, checkOrganizationAccess, async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    const orgId = req.params.id;

    let organization;

    if (currentUser?.role === "SUPERADMIN") {
      // SUPERADMIN can access any organization
      organization = await Organization.findById(orgId)
        .populate("createdBy", "firstName lastName email");
    } else if (currentUser?.role === "ADMIN") {
      // ADMIN can only access organizations they created
      organization = await Organization.findOne({
        _id: orgId,
        createdBy: currentUser._id
      }).populate("createdBy", "firstName lastName email");
    } else if (currentUser?.role === "ORGADMIN" || currentUser?.role === "USER") {
      // ORGADMIN and USER can only access their own organization
      if (!currentUser.organization || currentUser.organization._id.toString() !== orgId) {
        return res.status(403).json({ error: "Access denied to this organization" });
      }
      organization = await Organization.findById(orgId)
        .populate("createdBy", "firstName lastName email");
    }

    if (!organization) {
      return res.status(404).json({ error: "Organization not found or access denied" });
    }

    res.json({ organization });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unknown error occurred" });
    }
  }
});

// Update organization features - Enhanced access control
router.put(
  "/:id/features",
  authenticate,
  authorize("ORGADMIN", "ADMIN", "SUPERADMIN"),
  checkAdminOrganizationAccess,
  async (req: any, res: Response) => {
    try {
      const { features } = req.body;
      const currentUser = req.user;
      const orgId = req.params.id;

      let organization;

      if (currentUser.role === "SUPERADMIN") {
        // SUPERADMIN can update any organization
        organization = await Organization.findById(orgId);
      } else if (currentUser.role === "ADMIN") {
        // ADMIN can only update organizations they created
        organization = await Organization.findOne({
          _id: orgId,
          createdBy: currentUser._id
        });
      } else if (currentUser.role === "ORGADMIN") {
        // ORGADMIN can only update their own organization
        if (!currentUser.organization || currentUser.organization._id.toString() !== orgId) {
          return res.status(403).json({ error: "Access denied to this organization" });
        }
        organization = await Organization.findById(orgId);
      }

      if (!organization) {
        return res.status(404).json({ error: "Organization not found or access denied" });
      }

      // Validate features structure
      if (!Array.isArray(features)) {
        return res.status(400).json({ error: "Features must be an array" });
      }

      organization.features = features;
      await organization.save();

      const updatedOrg = await Organization.findById(organization._id)
        .populate("createdBy", "firstName lastName email");

      res.json({ organization: updatedOrg });
    } catch (error: unknown) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "An unknown error occurred" });
      }
    }
  }
);

// Delete organization - Enhanced access control
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "SUPERADMIN"),
  checkAdminOrganizationAccess,
  async (req: any, res: Response) => {
    try {
      const currentUser = req.user;
      const orgId = req.params.id;

      let organization;

      if (currentUser.role === "SUPERADMIN") {
        // SUPERADMIN can delete any organization
        organization = await Organization.findById(orgId);
      } else if (currentUser.role === "ADMIN") {
        // ADMIN can only delete organizations they created
        organization = await Organization.findOne({
          _id: orgId,
          createdBy: currentUser._id
        });
      }

      if (!organization) {
        return res.status(404).json({ error: "Organization not found or access denied" });
      }

      // Check if organization has users (prevent deletion if users exist)
      const User = require('../models/User');
      const userCount = await User.countDocuments({ organization: orgId });
      
      if (userCount > 0) {
        return res.status(400).json({ 
          error: `Cannot delete organization with ${userCount} users. Please remove all users first.` 
        });
      }

      await Organization.findByIdAndDelete(orgId);

      res.json({ message: "Organization deleted successfully" });
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