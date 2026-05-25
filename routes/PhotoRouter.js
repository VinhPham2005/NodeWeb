const express = require("express");
const Photo = require("../db/photoModel");
const User = require("../db/userModel");
const router = express.Router();



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
