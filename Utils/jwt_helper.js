const JWT = require("jsonwebtoken");
const createError = require("http-errors");
const client = require("./init_redis");
const { result } = require("@hapi/joi/lib/base");

const signAccessToken = (userId) => {
  return new Promise((resolve, reject) => {
    const payload = {};
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const options = {
      expiresIn: "20s",
      issuer: "Nischth MK",
      audience: userId.toString(),
    };
    JWT.sign(payload, secret, options, (err, token) => {
      if (err) {
        console.log(err);
        return reject(createError.InternalServerError());
      }

      return resolve(token);
    });
  });
};

const verifyAccessToken = (req, res, next) => {
  if (!req.headers["authorization"]) return next(createError.Unauthorized());
  const token = req.headers["authorization"].split(" ")[1];
  JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
    if (err) {
      console.log({ err });
      if (err.name == "JsonWebTokenError")
        return next(createError.Unauthorized());
      else return next(createError.Unauthorized(err.message));
    }
    req.payload = payload;
    next();
  });
};

const signRefreshToken = (userId) => {
  return new Promise((resolve, reject) => {
    const payload = {};
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const options = {
      expiresIn: "1y",
      issuer: "Nischth MK",
      audience: userId.toString(),
    };
    JWT.sign(payload, secret, options, (err, token) => {
      if (err) {
        console.log(err);
        return reject(createError.InternalServerError());
      }
      const c = client.SET(
        userId.toString(),
        token,
        { EX: 60 * 60 },
        (err, result) => {
          if (err) return reject(createError.InternalServerError());
          return resolve(token);
        }
      );
      resolve(token);
    });
  });
};

const verifyRefreshToken = (refreshToken) => {
  return new Promise((resolve, reject) => {
    JWT.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, payload) => {
        if (err) return reject(createError.Unauthorized());
        client.get(payload.aud).then((value) => {
          if (value == refreshToken) return resolve(payload.aud);
          return reject(createError.Unauthorized());
        });
      }
    );
  });
};
module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
};
