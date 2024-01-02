const express = require("express");
const morgan = require("morgan");
const createError = require("http-errors");
const AuthRoute = require("./Routes/Auth.route");
const { verifyAccessToken } = require("./Utils/jwt_helper");

require("dotenv").config();
require("./Utils/init_mongodb");
const c = require("./Utils/init_redis");
// c.set("testss", "123",);

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", verifyAccessToken, async (req, res, next) => {
  console.log(req.payload);
  res.send("Hello Express");
});

app.use("/auth", AuthRoute);

app.use(async (req, res, next) => {
  next(createError.NotFound());
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening in port ${PORT}`);
});
