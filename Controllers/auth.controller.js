const createError = require("http-errors");
const User = require("../Models/User.model");
const authSchema = require("../Utils/validation_schema");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../Utils/jwt_helper");
const client = require("../Utils/init_redis");

module.exports = {
  register: async (req, res, next) => {
    try {
      const result = await authSchema.validateAsync(req.body);

      const doesExist = await User.findOne({ email: result.email });
      if (doesExist) throw createError.Conflict("User already present");

      const user = new User(result);
      const saveduser = await user.save();
      const accessToken = await signAccessToken(saveduser._id);
      const refreshToken = await signRefreshToken(saveduser._id);
      res.send({ accessToken, refreshToken });
    } catch (error) {
      if (error.isJoi == true) error.status = 422;
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const result = await authSchema.validateAsync(req.body);

      const user = await User.findOne({ email: result.email });
      if (!user) throw createError.BadRequest("User not registered");

      const passwordMatch = await user.isValidPassword(result.password);
      if (!passwordMatch)
        throw createError.Unauthorized("username/password not valid");

      const accessToken = await signAccessToken(user._id);
      const refreshToken = await signRefreshToken(user._id);
      res.send({ accessToken, refreshToken });
    } catch (error) {
      console.log("error" + JSON.stringify(error));
      if (error.isJoi == true)
        return next(createError.BadRequest("Invalid username/password"));
      next(error);
    }
  },

  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return next(createError.BadRequest());
      const userID = await verifyRefreshToken(refreshToken);

      const accesstoken = await signAccessToken(userID);
      const refreshtoken = await signRefreshToken(userID);

      res.send({ accesstoken, refreshtoken });
    } catch (err) {
      next(err);
    }
  },

  logout: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return next(createError.BadRequest());
      const userId = await verifyRefreshToken(refreshToken);
      client
        .DEL(userId)
        .then(() =>
          res.send({
            message: "Logged out successfully",
          })
        )
        .catch((err) => next(createError.InternalServerError()));
    } catch (error) {
      next(error);
    }
  },
};
