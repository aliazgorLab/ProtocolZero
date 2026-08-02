const User = require("../models/User");
const Report = require("../models/Report");

// @desc    Update user resource inventory
// @route   PATCH /api/resources/inventory
// @access  Protected (Volunteer, ResponseTeam)
exports.updateInventory = async (req, res) => {
  try {
    // Expected body: { inventory: [{ itemName, quantity, unit }] }
    const { inventory } = req.body;

    if (!Array.isArray(inventory)) {
      return res.status(400).json({
        success: false,
        message: "Inventory must be an array of items.",
      });
    }

    // Basic validation on items
    for (const item of inventory) {
      if (!item.itemName || item.quantity == null || !item.unit) {
        return res.status(400).json({
          success: false,
          message: "Each inventory item must have itemName, quantity, and unit.",
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { inventory } },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Inventory updated successfully.",
      data: updatedUser.inventory,
    });
  } catch (error) {
    console.error("[ERROR] Update Inventory Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating inventory.",
    });
  }
};

// @desc    Commit resources to a report
// @route   PATCH /api/reports/:id/resources
// @access  Protected (ResponseTeam)
exports.commitResources = async (req, res) => {
  try {
    const { id } = req.params;
    // Expected body: { items: [{ itemName, quantity, unit }] }
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required to commit resources.",
      });
    }

    // Validate items
    const newCommitments = [];
    for (const item of items) {
      if (!item.itemName || item.quantity == null || !item.unit) {
        return res.status(400).json({
          success: false,
          message: "Each committed item must have itemName, quantity, and unit.",
        });
      }
      const commitment = {
        providerId: req.user._id,
        itemName: item.itemName,
        quantity: Number(item.quantity),
        unit: item.unit,
        createdAt: new Date(),
      };

      if (item.location) {
        commitment.location = {
          type: item.location.type || "Point",
          coordinates: item.location.coordinates,
        };
      }

      newCommitments.push(commitment);
    }

    // Resolve report to ensure it exists and is active
    const reportService = require("../services/report.service");
    const report = await reportService.resolveReportById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    if (report.status === "closed") {
      return res.status(409).json({
        success: false,
        message: "Cannot commit resources to a closed report.",
      });
    }

    // Push new commitments
    report.resourcesCommitted.push(...newCommitments);
    await report.save();

    return res.status(200).json({
      success: true,
      message: "Resources committed successfully.",
      data: report.resourcesCommitted,
    });
  } catch (error) {
    console.error("[ERROR] Commit Resources Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while committing resources.",
    });
  }
};

// @desc    Deduct items from personal inventory
// @route   PATCH /api/resources/inventory/deduct
// @access  Protected (Volunteer, ResponseTeam)
exports.deductInventory = async (req, res) => {
  try {
    // Expected body: { deductions: [{ itemName, quantityToDeduct }] }
    const { deductions } = req.body;
    
    if (!Array.isArray(deductions)) {
      return res.status(400).json({
        success: false,
        message: "Deductions must be an array.",
      });
    }

    const user = await User.findById(req.user._id);

    for (const deduction of deductions) {
      const { itemName, quantityToDeduct } = deduction;
      if (!itemName || quantityToDeduct == null) continue;

      const itemIndex = user.inventory.findIndex((item) => item.itemName === itemName);
      if (itemIndex > -1) {
        user.inventory[itemIndex].quantity -= Number(quantityToDeduct);
        if (user.inventory[itemIndex].quantity <= 0) {
          user.inventory.splice(itemIndex, 1);
        }
      }
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Inventory deducted successfully.",
      data: user.inventory,
    });
  } catch (error) {
    console.error("[ERROR] Deduct Inventory Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deducting inventory.",
    });
  }
};
