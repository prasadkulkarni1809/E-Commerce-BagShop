const express = require("express");
const router = express.Router();
const ownerModel = require("../models/owner-model");

router.post("/create", async (req, res) => {
  console.log("CREATE ROUTE HIT");

  try {
    console.log("Checking owners...");
    const owners = await ownerModel.find().lean().limit(1);

        if (owners.length > 0) {
        return res
            .status(403)
            .send("You don't have permission to create a new owner");
        }

    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).send("Missing fields");
    }

    const createdOwner = await ownerModel.create({
      fullname,
      email,
      password,
    });

    res.status(201).json(createdOwner);

  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).send("Internal server error");
  }
});

router.get("/admin", (req, res) => {
  res.render("createproducts");
});

module.exports = router;
