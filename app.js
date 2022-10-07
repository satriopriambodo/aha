if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const route = require("./routes/index");
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(route);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
