const db = require("../database");
const GrantModel = require("../model/opsgrants.model");
class opsGrantController {
  async getGrants({ currentPage = 1, limit = 10, search = "" }) {
    try {
      const searchQuery = search
        ? {
            $text: { $search: search },
          }
        : {};

      const total = await GrantModel.countDocuments(searchQuery);

      const grants = await GrantModel.find(searchQuery)
        .skip((currentPage - 1) * limit)
        .limit(limit);

      const totalPages = Math.ceil(total / limit);

      return {
        ok: true,
        grants,
        currentPage: currentPage,
        limit,
        totalGrants: total,
        totalPages,
      };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }
  async getAllOpsGrant({ currentPage }) {
    try {
      const itemsPerPage = 10;
      const offset = (currentPage - 1) * itemsPerPage;
      console.log(currentPage, itemsPerPage, offset);

      // Get total count for pagination
      const totalCount = await new Promise((resolve, reject) => {
        db.get("SELECT COUNT(*) as count FROM opgrants", [], (err, row) => {
          if (err) reject(err);
          resolve(row.count);
        });
      });

      // Get paginated results
      const rows = await new Promise((resolve, reject) => {
        db.all(
          "SELECT * FROM opgrants LIMIT ? OFFSET ?",
          [itemsPerPage, offset],
          (err, rows) => {
            if (err) reject(err);
            resolve(rows);
          }
        );
      });

      return {
        ok: true,
        grants: rows,
        currentPage: currentPage,
        totalPages: Math.ceil(totalCount / itemsPerPage),
        message: "Opsgrant retrieved successfully",
      };
    } catch (err) {
      return {
        ok: false,
        grants: null,
        currentPage: null,
        totalPages: null,
        message: err.message,
      };
    }
  }

  async getOperationalGrantsDashboardSummary() {
    try {
      const [
        businessLGAStats,
        businessRegIssuerStats,
        genderStats,
        civilServantStats,
        idDocTypeStats,
        businessLGACodeStats,
      ] = await Promise.all([
        // Get businessLGA aggregation
        GrantModel.aggregate([
          { $match: { businessLGA: { $exists: true, $ne: null } } },
          {
            $group: {
              _id: "$businessLGA",
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              businessLGA: "$_id",
              count: 1,
            },
          },
          { $sort: { businessLGA: 1 } },
        ]),

        // Get businessRegIssuer aggregation
        GrantModel.aggregate([
          { $match: { businessRegIssuer: { $exists: true, $ne: null } } },
          {
            $group: {
              _id: "$businessRegIssuer",
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              businessRegIssuer: "$_id",
              count: 1,
            },
          },
          { $sort: { businessRegIssuer: 1 } },
        ]),

        // Get gender aggregation
        GrantModel.aggregate([
          { $match: { gender: { $exists: true, $ne: null } } },
          {
            $group: {
              _id: "$gender",
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              gender: "$_id",
              count: 1,
            },
          },
          { $sort: { gender: 1 } },
        ]),

        // Get civilServant aggregation
        GrantModel.aggregate([
          { $match: { civilServant: { $exists: true } } },
          {
            $group: {
              _id: "$civilServant",
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              isCivilServant: { $eq: ["$_id", true] },
              count: 1,
            },
          },
          { $sort: { isCivilServant: -1 } },
        ]),

        // Get idDocType aggregation
        GrantModel.aggregate([
          { $match: { idDocType: { $exists: true, $ne: null } } },
          {
            $group: {
              _id: "$idDocType",
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              idDocument: {
                idDocType: "$_id",
              },
              count: 1,
            },
          },
          { $sort: { "idDocument.idDocType": 1 } },
        ]),

        // Get businessLGACode aggregation
        GrantModel.aggregate([
          { $match: { businessLGACode: { $exists: true, $ne: null } } },
          {
            $group: {
              _id: "$businessLGACode",
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              businessLGACode: "$_id",
              count: 1,
            },
          },
          {
            $sort: {
              businessLGACode: 1,
            },
          },
        ]),
      ]);

      return [
        {
          businessLGA: businessLGAStats,
          businessRegIssuer: businessRegIssuerStats,
          gender: genderStats,
          isCivilServant: civilServantStats,
          idDocType: idDocTypeStats,
          businessLGACode: businessLGACodeStats,
          ok: true,
        },
      ];
    } catch (error) {
      console.error("Error generating dashboard summary:", error);
      return [
        {
          businessLGA: [],
          businessRegIssuer: [],
          gender: [],
          isCivilServant: [],
          idDocType: [],
          businessLGACode: [],
          ok: false,
        },
      ];
    }
  }

  // Create a new grant (MongoDB)
  async createGrant(grantData) {
    try {
      const newGrant = new GrantModel(grantData);
      await newGrant.save();
      return {
        ok: true,
        grant: newGrant,
        message: "Grant created successfully",
      };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  // Get a single grant by ID (MongoDB)
  async getGrantById(grantId) {
    try {
      const grant = await GrantModel.findById(grantId);
      if (!grant) {
        return { ok: false, message: "Grant not found" };
      }
      return { ok: true, grant };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  //Update a grant by ID (MongoDB)
  async updateGrant(grantId, updateData) {
    try {
      const updatedGrant = await GrantModel.findByIdAndUpdate(
        grantId,
        updateData,
        { new: true }
      );
      if (!updatedGrant) {
        return { ok: false, message: "Grant not found" };
      }
      return {
        ok: true,
        grant: updatedGrant,
        message: "Grant updated successfully",
      };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async updateGrantStatus(grantId, status) {
    try {
      const validStatuses = ["Eligible", "Disbursed", "Rejected"];
      if (!validStatuses.includes(status)) {
        return {
          ok: false,
          message: "Invalid status. Use Eligible, Disbursed, or Rejected.",
        };
      }

      const updatedGrant = await GrantModel.findByIdAndUpdate(
        grantId,
        { status },
        { new: true }
      );

      if (!updatedGrant) {
        return { ok: false, message: "Grant not found" };
      }

      return {
        ok: true,
        grant: updatedGrant,
        message: `Grant updated to ${status}`,
      };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  //   // Get all grants by status
  //   async getGrantsByStatus(status) {
  //     try {
  //       const grants = await GrantModel.find({ status });
  //       return { ok: true, grants };
  //     } catch (error) {
  //       return { ok: false, message: error.message };
  //     }
  //   }

  async getGrantsByStatus({
    currentPage = 1,
    limit = 10,
    search = "",
    status = "",
  }) {
    try {
      let searchQuery = {};

      // Apply full-text search if provided
      if (search) {
        searchQuery.$text = { $search: search };
      }

      // Validate and apply status filter
      const validStatuses = ["Eligible", "Disbursed", "Rejected"];
      if (status) {
        if (!validStatuses.includes(status)) {
          return { ok: true, grants: [], message: "Invalid status provided." };
        }
        searchQuery.status = status;
      }

      // Get total count for pagination
      const total = await GrantModel.countDocuments(searchQuery);

      // Fetch paginated results
      const grants = await GrantModel.find(searchQuery)
        .skip((currentPage - 1) * limit)
        .limit(limit);

      return {
        ok: true,
        grants,
        currentPage,
        limit,
        totalGrants: total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  // Get all grants' longitude & latitude for a given LGA and Ward
  async getCoordinatesByWard(businessLGA, businessWard) {
    try {
      // Ensure both LGA & Ward are provided
      if (!businessLGA || !businessWard) {
        return { ok: false, message: "LGA and Ward are required." };
      }

      // Find grants in the selected LGA & Ward
      const grants = await GrantModel.find(
        { businessLGA, businessWard }
        // { latitude: 1, longitude: 1, businessName: 1, _id: 0 }
      );

      if (!grants.length) {
        return { ok: false, message: "No grants found in this ward." };
      }

      return { ok: true, grants };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  // Get businesses for Yellow Pages with pagination and filtering
  async getYellowPages({
    currentPage = 1,
    limit = 10,
    businessRegIssuer = "",
    businessLGA = "",
    businessWard = "",
  }) {
    try {
      let searchQuery = {};

      // Apply filters only if values are provided
      if (businessRegIssuer) searchQuery.businessRegIssuer = businessRegIssuer;
      if (businessLGA) searchQuery.businessLGA = businessLGA;
      if (businessWard) searchQuery.businessWard = businessWard;

      // Get total count for pagination
      const total = await GrantModel.countDocuments(searchQuery);

      // Fetch paginated results with additional fields
      const businesses = await GrantModel.find(searchQuery)
        .skip((currentPage - 1) * limit)
        .limit(limit);

      return {
        ok: true,
        businesses,
        currentPage,
        limit,
        totalBusinesses: total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  // Delete a grant by ID (MongoDB)
  async deleteGrant(grantId) {
    try {
      const deletedGrant = await GrantModel.findByIdAndDelete(grantId);
      if (!deletedGrant) {
        return { ok: false, message: "Grant not found" };
      }
      return { ok: true, message: "Grant deleted successfully" };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }
}

module.exports = new opsGrantController();
