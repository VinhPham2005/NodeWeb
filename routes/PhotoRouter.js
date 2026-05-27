const express = require("express");
const Photo = require("../db/photoModel");
const User = require("../db/userModel");
const router = express.Router();
const jwt = require("jsonwebtoken");
const multer = require("multer"); 
const path = require("path");
const fs = require("fs");
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

const uploadDir = path.join(__dirname, "../images"); // Trỏ ra thư mục images ở ngoài root
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir); // Tự động tạo thư mục images nếu chưa có
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 3. Yêu cầu đề bài: Tạo tên file độc nhất (Unique name)
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext); 
  },
});

const upload = multer({ storage: storage });

// 4. API POST /new để nhận ảnh
router.post("/new", upload.single("photo"), async (req, res) => {
  // Báo lỗi 400 nếu request không có file (Đúng yêu cầu đề bài)
  if (!req.file) {
    return res.status(400).send("Không tìm thấy file trong request.");
  }

  try {
    // Tạo object Photo mới với tên file độc nhất, ngày tạo và ID người đăng
    const newPhoto = new Photo({
      file_name: req.file.filename,
      date_time: new Date(),
      user_id: req.userId, // req.userId lấy từ verifyToken
      comments: [],
    });

    await newPhoto.save();
    res.status(200).send(newPhoto);
  } catch (error) {
    console.error("Lỗi khi upload ảnh:", error);
    res.status(500).send("Lỗi server khi upload ảnh");
  }
});

module.exports = router;
