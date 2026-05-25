const express = require("express");
const User = require("../db/userModel");
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

router.post("/", async (request, response) => {});

router.get("/", async (request, response) => {});

router.post("/admin/login", async (req, res) => {
  const { login_name, password } = req.body;

  if (!login_name || !password) {
    return res.status(400).send("login_name and password are required");
  }

  try {
    const user = await User.findOne({ login_name: login_name });
    if (!user) {
      return res.status(400).send("Invalid login_name");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("Invalid password");
    }

    const token = jwt.sign(
      { userId: user._id, login_name: user.login_name }, 
      JWT_SECRET, 
      { expiresIn: "24h" }
    );

    res.status(200).json({ 
      token: token,
      user: {
        _id: user._id, 
        first_name: user.first_name,
        login_name: user.login_name 
      }
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post("/admin/logout", (req, res) => {
  res.status(200).send("Successfully logged out");
});

router.get("/test/info", async (req, res) => {
  try {
    const info = await SchemaInfo.findOne();
    res.json(info);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).send("Unauthorized: Missing token.");
  }
  

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send("Unauthorized: Invalid or expired token.");
    }
    req.userId = decoded.userId;
    next();
  });
};

router.use(verifyToken);

router.get("/list", async (request, response) => {
  try {
    const users = await User.find({}, "_id first_name last_name");
    response.status(200).send(users);
  } catch (error) {
    response.status(500).send({ message: "Internal server error" });
  }
});

router.get("/:id", async (request, response) => {
  const userId = request.params.id;
  try {
    const user = await User.findById(
      userId,
      "_id first_name last_name location description occupation"
    );

    if (!user) {
      return response
        .status(400)
        .send({ message: "Không tìm thấy user với ID này" });
    }

    response.status(200).send(user);
  } catch (error) {
    response.status(400).send({ message: "ID không hợp lệ", error: error });
  }
});

module.exports = router;
