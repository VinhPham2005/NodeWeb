const express = require("express");
const cors = require("cors");
const path = require("path");
const models = require("./modelData/models");

const app = express();
const port = process.env.PORT || 3001;
app.use(cors());

// Serve folder ảnh tĩnh 1 lần duy nhất
app.use("/images", express.static(path.join(__dirname, "public/images")));

// API test
app.get("/test/info", (req, res) => {
  res.json(models.schemaInfo());
});

// User list
app.get("/user/list", (req, res) => {
  res.json(models.userListModel());
});

// User detail
app.get("/user/:id", (req, res) => {
  res.json(models.userModel(req.params.id));
});

// Photos of user
app.get("/photosOfUser/:userId", (req, res) => {
  const userId = req.params.userId;
  const photos = models.photoOfUserModel(userId);

  const photosWithUrl = photos.map((p) => ({
    ...p,
    url: `/images/${p.file_name}`,
  }));

  res.json(photosWithUrl);
});

// Start server
app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
