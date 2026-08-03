const User = require("../models/User");
const Report = require("../models/Report");
const { RESOURCE_TAXONOMY, RESOURCE_CATEGORIES } = require("../constants/resources");

// @desc    Get standardized resource taxonomy catalog
// @route   GET /api/resources/taxonomy
// @access  Public / Authenticated
exports.getTaxonomy = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      taxonomy: RESOURCE_TAXONOMY,
      categories: RESOURCE_CATEGORIES,
    },
  });
};

// @desc    Update user resource inventory
// @route   PATCH /api/resources/inventory
// @access  Protected (Volunteer, ResponseTeam)
exports.updateInventory = async (req, res) => {
  try {
    const { inventory } = req.body;

    if (!Array.isArray(inventory)) {
      return res.status(400).json({
        success: false,
        message: "Inventory must be an array of items.",
      });
    }

    const formattedInventory = [];
    for (const item of inventory) {
      const tax = RESOURCE_TAXONOMY.find((r) => r.id === item.itemId || r.id === item.id);
      if (!tax && !item.itemName) {
        return res.status(400).json({
          success: false,
          message: `Invalid resource itemId: '${item.itemId}'`,
        });
      }
      formattedInventory.push({
        itemId: item.itemId || item.id,
        itemName: tax ? tax.name : item.itemName,
        category: tax ? tax.category : item.category,
        quantity: Math.max(0, Number(item.quantity) || 0),
        unit: tax ? tax.defaultUnit : item.unit,
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { inventory: formattedInventory } },
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
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required to commit resources.",
      });
    }

    const newCommitments = [];
    for (const item of items) {
      const tax = RESOURCE_TAXONOMY.find((r) => r.id === item.itemId || r.id === item.id);
      const commitment = {
        providerId: req.user._id,
        itemId: item.itemId || item.id,
        itemName: tax ? tax.name : item.itemName,
        category: tax ? tax.category : item.category,
        quantity: Number(item.quantity),
        unit: tax ? tax.defaultUnit : item.unit,
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

    report.resourcesCommitted.push(...newCommitments);
    await report.save();

    // Broadcast Socket event
    try {
      const { emitReportToGeoRooms } = require("../socket");
      emitReportToGeoRooms("report:resource_committed", report, {
        reportId: report._id,
        postId: report.postId,
        resourcesCommitted: report.resourcesCommitted,
      });
    } catch (socketErr) {
      console.warn("Socket emission failed for committed resources:", socketErr.message);
    }

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
    const { deductions } = req.body;

    if (!Array.isArray(deductions)) {
      return res.status(400).json({
        success: false,
        message: "Deductions must be an array.",
      });
    }

    const user = await User.findById(req.user._id);

    for (const deduction of deductions) {
      const { itemId, itemName, quantityToDeduct } = deduction;
      if ((!itemId && !itemName) || quantityToDeduct == null) continue;

      const itemIndex = user.inventory.findIndex(
        (item) => (itemId && item.itemId === itemId) || (itemName && item.itemName === itemName)
      );

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
