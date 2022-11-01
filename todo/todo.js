const express = require("express");
const router = express.Router();

//json+url
router.use(express.json());
router.use(express.urlencoded({extended: false}));

//cors
router.use((req, res, next) => {
	let origins = process.env.ORIGINS.split("|");
	let origin = req.headers.origin;
	if (origins.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
	res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");
	res.setHeader("Access-Control-Allow-Credentials", true);
	next();
});

//session
const Pool = require("pg").Pool;
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});
const session = require("express-session");
router.use(session({
	store: new (require("connect-pg-simple")(session))({pool: pool, createTableIfMissing: true}),
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: true,
	cookie: {secure: (process.env.LOCAL? false: true), sameSite: "none"},
}));

//api router
const api = require("./api");
router.use("/api/", api);

//files
const path = require("path");
const fs = require("fs");
router.get("/", (req, res) => {
	res.sendFile(path.join(__dirname + "/html/index.html"));
});
router.get("/js/:file", async (req, res) => {
	let file = path.join(__dirname + "/js/" + req.params.file);
	if (fs.existsSync(file)) res.sendFile(file);
	else res.send("empty file!");
});
router.get("/css/:file", (req, res) => {
	let file = path.join(__dirname + "/css/" + req.params.file);
	if (fs.existsSync(file)) res.sendFile(file);
	else res.send("empty file!");
});
router.get("/jpg/:file", (req, res) => {
	let file = path.join(__dirname + "/jpg/" + req.params.file);
	if (fs.existsSync(file)) res.sendFile(file);
	else res.send("empty file!");
});

module.exports = router;