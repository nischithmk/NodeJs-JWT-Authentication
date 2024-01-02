const express = require("express");
const router = express.Router();
const AuthController = require("../Controllers/auth.controller");

router.post("/register", AuthController.register);

router.post("/login", AuthController.login);

router.post("/refresh-token", AuthController.refreshToken);

router.delete("/logout", AuthController.logout);

module.exports = router;
