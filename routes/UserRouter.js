const express = require("express");
const User = require("../db/userModel");
const router = express.Router();

router.post("/", async (request, response) => {});

router.get("/", async (request, response) => {});

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
