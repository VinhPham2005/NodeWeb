const express = require("express");
const Photo = require("../db/photoModel");
const User = require("../db/userModel");
const router = express.Router();
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

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

router.post("/commentsOfPhoto/:photoId", async (req, res) => {
  const photoId = req.params.photoId;
  const { comment } = req.body;

  if (!comment || comment.trim() === "") {
    return res.status(400).send("Comment cannot be empty");
  }

  try {    
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).send("Photo not found");
    } else {
      const newComment = {
        comment: comment, 
        user_id: req.userId,
        date_time: new Date(),
      };
      photo.comments.push(newComment);
      await photo.save();
      res.status(200).json({ message: "Comment added successfully" });
    }
  } catch (err) {    
    res.status(500).send(err.message);
  }
});


router.get("/:id", async (request, response) => {
  const userId = request.params.id;

  try {
    const photos = await Photo.find({ user_id: userId })
      .select("_id user_id comments file_name date_time")
      .lean();

    if (!photos) {
      return response.status(400).send({ message: "Not found" });
    }

    for (const photo of photos) {
      if (photo.comments && photo.comments.length > 0) {
        const commentPromises = photo.comments.map(async (comment) => {
          const userObj = await User.findById(comment.user_id).select(
            "_id first_name last_name"
          );

          return {
            _id: comment._id,
            comment: comment.comment,
            date_time: comment.date_time,
            user: userObj,
          };
        });

        photo.comments = await Promise.all(commentPromises);
      }
    }

    response.status(200).send(photos);
  } catch (error) {
    console.error(error);
    response.status(400).send({ message: "Invalid ID", error: error.message });
  }
});

module.exports = router;
