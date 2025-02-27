const express = require("express");
const { Router } = express;
const opsGrantController = require("../controller/opsgrant.controller");
const kadunaWards = require("../model/wards.model");
const banks = require("../banks");
module.exports = () => {
  const api = new Router();

  // Get all LGAs
  api.get("/lgas", (req, res) => {
    res.json({ ok: true, lgas: Object.keys(kadunaWards) });
  });

  // Get all Banks
  api.get("/all/banks", (req, res) => {
    try {
      // If no banks found, return a message
      if (!banks || banks.length === 0) {
        return res.status(404).json({ ok: false, message: "No banks found" });
      }

      // Return the list of banks with a success status
      res.status(200).json({ ok: true, data: banks });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        ok: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  });

  // Get all Wards for a given LGA
  api.get("/lgas/wards/:lga", (req, res) => {
    let { lga } = req.params;

    // Normalize input: Convert to lowercase and trim spaces
    lga = lga.trim().toLowerCase();

    // Find the matching LGA name from the keys of the kadunaWards object
    const matchedLGA = Object.keys(kadunaWards).find(
      (key) => key.toLowerCase() === lga
    );

    if (!matchedLGA) {
      return res.status(400).json({ ok: false, message: "Invalid LGA" });
    }

    res.json({ ok: true, wards: kadunaWards[matchedLGA] });
  });

  api.get("/", async (req, res) => {
    try {
      const query = req.query;
      const {
        ok,
        grants,
        currentPage,
        totalPages,
        limit,
        totalGrants,
        message,
      } = await opsGrantController.getGrants(query);
      if (ok) {
        res.json({
          ok,
          grants,
          currentPage,
          totalPages,
          limit,
          totalGrants,
          message,
        });
      } else {
        res.status(500).json({ ok: false, message });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  api.get("/summary", async (req, res) => {
    try {
      const result =
        await opsGrantController.getOperationalGrantsDashboardSummary();
      res.json({ ok: true, result });
    } catch (error) {
      res.status(500).json([
        {
          businessLGA: [],
          businessRegIssuer: [],
          gender: [],
          isCivilServant: [],
          idDocType: [],
          businessLGACode: [],
          ok: false,
        },
      ]);
    }
  });

  api.get("/status", async (req, res) => {
    try {
      const { currentPage, limit, search, status } = req.query; // Extract query parameters

      const response = await opsGrantController.getGrants({
        currentPage: parseInt(currentPage) || 1,
        limit: parseInt(limit) || 10,
        search: search || "",
        status: status || "",
      });

      response.ok
        ? res.json(response)
        : res.status(400).json({ ok: false, message: response.message });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all grants' coordinates by LGA & Ward
  api.get("/coordinates", async (req, res) => {
    const { businessLGA, businessWard } = req.query;

    const response = await opsGrantController.getCoordinatesByWard(
      businessLGA,
      businessWard
    );

    response.ok
      ? res.json(response)
      : res.status(404).json({ ok: false, message: response.message });
  });

  // Get businesses for Yellow Pages with filters and pagination
  api.get("/yellow-pages", async (req, res) => {
    try {
      const {
        currentPage,
        limit,
        businessRegIssuer,
        businessLGA,
        businessWard,
      } = req.query;

      const response = await opsGrantController.getYellowPages({
        currentPage: parseInt(currentPage) || 1,
        limit: parseInt(limit) || 10,
        businessRegIssuer: businessRegIssuer || "",
        businessLGA: businessLGA || "",
        businessWard: businessWard || "",
      });

      response.ok
        ? res.json(response)
        : res.status(400).json({ ok: false, message: response.message });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  //  Get a single grant by ID
  api.get("/:id", async (req, res) => {
    const response = await opsGrantController.getGrantById(req.params.id);
    response.ok
      ? res.json(response)
      : res.status(404).json({ ok: false, message: response.message });
  });

  //  Route to update status to "Eligible"
  api.patch("/eligible/:id", async (req, res) => {
    const { id } = req.params;
    const response = await opsGrantController.updateGrantStatus(id, "Eligible");

    response.ok
      ? res.json(response)
      : res.status(400).json({ ok: false, message: response.message });
  });

  // Route to update status to "Disbursed"
  api.patch("/disbursed/:id", async (req, res) => {
    const { id } = req.params;
    const response = await opsGrantController.updateGrantStatus(
      id,
      "Disbursed"
    );

    response.ok
      ? res.json(response)
      : res.status(400).json({ ok: false, message: response.message });
  });

  // Route to update status to "Rejected"
  api.patch("/rejected/:id", async (req, res) => {
    const { id } = req.params;
    const response = await opsGrantController.updateGrantStatus(id, "Rejected");

    response.ok
      ? res.json(response)
      : res.status(400).json({ ok: false, message: response.message });
  });

  //  Create a new grant
  api.post("/", async (req, res) => {
    const response = await opsGrantController.createGrant(req.body);
    response.ok
      ? res.status(201).json(response)
      : res.status(400).json({ ok: false, message: response.message });
  });

  //  Update a grant by ID
  api.put("/:id", async (req, res) => {
    const response = await opsGrantController.updateGrant(
      req.params.id,
      req.body
    );
    response.ok
      ? res.json(response)
      : res.status(400).json({ ok: false, message: response.message });
  });

  //  Delete a grant by ID
  api.delete("/:id", async (req, res) => {
    const response = await opsGrantController.deleteGrant(req.params.id);
    response.ok
      ? res.json(response)
      : res.status(400).json({ ok: false, message: response.message });
  });

  return api;
};
