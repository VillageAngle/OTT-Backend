import express from "express";
import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

const app = express();
const port = process.env.PORT;

app.get("/health", (req, res) => {
  res.send("Api is healthy");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
