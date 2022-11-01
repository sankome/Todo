const express = require("express");
const router = express.Router();

const users = require("./users");
router.use("/users/", users);

const todos = require("./todos");
router.use("/todos/", todos);

module.exports = router;