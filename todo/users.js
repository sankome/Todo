const express = require("express");
const router = express.Router();

//connect
const Pool = require("pg").Pool;
const pg = new Pool({
	connectionString: process.env.DATABASE_URL,
});

//functions
const crypto = require("crypto");
async function create(username, password) {
	if (!username || !password) return {result: "username or password not entered", login: false};
	if (username.trim().length == 0) return {result: "username not entered", login: false};
	username = username.trim().toLowerCase();
	if (username.length > 20) return {result: "username should be less than 20 characters long", login: false};
	let salt = crypto.randomBytes(16).toString("hex");
	let hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha256").toString("hex");
	let duplicate = await pg.query("SELECT username FROM users WHERE username = $1;", [username]);
	if (duplicate.rowCount) return {result: "already exists", login: false};
	try {
		let res = await pg.query(
			"INSERT INTO users (username, hash, salt) VALUES ($1, $2, $3) RETURNING *;",
			[username, hash, salt]
		);
		return {result: "user created", username: res.rows[0].username, userId: res.rows[0].id, login: true};
	} catch (error) {
		console.log(error);
		return {result: "error", login: false};
	}
}
async function changeUsername(username, session) {
	if (!session.username || ! session.userId) return {logout: true};
	if (!username) return {result: "username not entered"};
	if (username.length > 20) return {result: "username should be less than 20 characters long"};
	if (username.trim().length == 0) return {result: "username not entered"};
	username = username.trim().toLowerCase();
	try {
		let duplicate = await pg.query("SELECT username FROM users WHERE username = $1;", [username]);
		if (duplicate.rowCount) return {result: "username already exists", login: true};
		
		let res = await pg.query(
			"UPDATE users SET username = $1 WHERE id = $2 RETURNING *;",
			[username, session.userId]
		);
		return {result: "username changed", username: res.rows[0].username, userId: res.rows[0].id, changed: true, login: true};
	} catch (error) {
		console.log(error);
		return {result: "error", login: true};
	}
}
async function changePassword(passwordOld, passwordNew, session) {
	if (!session.username || ! session.userId) return {logout: true};
	if (!passwordOld && !passwordNew) return {result: "passwords not entered"};
	else if (!passwordOld) return {result: "old password not entered"};
	else if (!passwordNew) return {result: "new password not entered"};
	try {
		let user = await pg.query("SELECT * FROM users WHERE id = $1;", [session.userId]);
		if (user.rowCount) {
			let salt = user.rows[0].salt;
			let hash = crypto.pbkdf2Sync(passwordOld, salt, 1000, 64, "sha256").toString("hex");
			if (hash == user.rows[0].hash) {
				
				salt = crypto.randomBytes(16).toString("hex");
				hash = crypto.pbkdf2Sync(passwordNew, salt, 1000, 64, "sha256").toString("hex");
				let res = await pg.query(
					"UPDATE users SET hash = $2, salt = $3 WHERE id = $1 RETURNING *;",
					[session.userId, hash, salt]
				);
				return {result: "password changed", changed: true};
			} else {
				return {result: "password incorrect"};
			}
		} else {
			return {result: "user not found"};
		}
	} catch (error) {
		console.log(error);
		return {result: "error"};
	}
}
async function login(username, password, remember) {
	if (!username || !password) return {result: "username or password not entered", login: false};
	if (username.trim().length == 0) return {result: "username not entered", login: false};
	username = username.trim().toLowerCase();
	try {
		let user = await pg.query("SELECT * FROM users WHERE username = $1;", [username]);
		if (user.rowCount) {
			let salt = user.rows[0].salt;
			let hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha256").toString("hex");
			if (hash == user.rows[0].hash) {
				return {result: "logged in", username: user.rows[0].username, userId: user.rows[0].id, login: true};
			} else {
				return {result: "details incorrect", login: false};
			}
		} else {
			return {result: "user not found", login: false};
		}
	} catch (error) {
		console.log(error);
		return {result: "error", login: false};
	}
}
async function status(session) {
	if (session.username && session.userId) {
		return {result: "logged in", login: true};
	} else {
		session.username = null;
		session.userId = null;
		return {result: "not logged in", login: false};
	}
}
function setSessionLogin(result, session) {
	if (!result) {
		session.username = null;
		session.userId = null;
		session.destroy();
		return;
	}
	if (result.login && result.username && result.userId) {
		session.username = result.username;
		session.userId = result.userId;
	} else {
		result.login = false;
		session.username = null;
		session.userId = null;
	}
}

//friends
async function request(to, session) {
	if (!session.username || ! session.userId) return {logout: true};
	try {
		let user = await pg.query("SELECT * FROM users WHERE username = $1;", [to]);
		let toId;
		if (user.rowCount) toId = user.rows[0].id;
		else return {result: "user not found"};
		if (toId == session.userId) return {result: "cannot friend yourself"};
		let duplicate = await pg.query(
			"SELECT * FROM friends WHERE (fromId = $1 and toId = $2) OR (fromId = $2 and toId = $1);",
			[session.userId, toId]
		);
		if (duplicate.rowCount) return {result: "already requested"};
		let result = await pg.query(
			"INSERT INTO friends (fromId, toId, status) VALUES ($1, $2, 0);",
			[session.userId, toId]
		);
		return {result: "friend requested", requested: true};
	} catch (error) {
		console.log(error);
		return {result: "error"};
	}
}
async function checkRequests(session) {
	if (!session.username || ! session.userId) return {logout: true};
	try {
		let requests = await pg.query("SELECT friends.fromId AS fromId, users.username AS username FROM friends INNER JOIN users ON friends.fromId = users.id WHERE friends.toId = $1 AND status = 0;", [session.userId]);
		return {result: "success", requests: requests.rows};
	} catch(error) {
		console.log(error);
		return {result: "error"};
	}
}
async function checkRequestings(session) {
	if (!session.username || ! session.userId) return {logout: true};
	try {
		let requestings = await pg.query("SELECT friends.toId AS toId, users.username AS username FROM friends INNER JOIN users ON friends.toId = users.id WHERE friends.fromId = $1 AND status = 0;", [session.userId]);
		return {result: "success", requestings: requestings.rows};
	} catch(error) {
		console.log(error);
		return {result: "error"};
	}
}
async function acceptRequest(from, session) {
	if (!session.username || ! session.userId) return {logout: true};
	try {
		let exists = await pg.query(
			"SELECT * FROM friends WHERE ((fromId = $1 and toId = $2) OR (fromId = $2 and toId = $1)) AND status = 0;",
			[from, session.userId]
		);
		if (!exists.rowCount) return {result: "request not found"};
		let result = await pg.query(
			"UPDATE friends SET status = 1 WHERE fromId = $1 AND toId = $2;",
			[from, session.userId]
		);
		return {result: "request accepted", accepted: true};
	} catch (error) {
		console.log(error);
		return {result: "error"};
	}
}
async function declineRequest(from, session) {
	if (!session.username || ! session.userId) return {logout: true};
	try {
		let exists = await pg.query(
			"SELECT * FROM friends WHERE ((fromId = $1 and toId = $2) OR (fromId = $2 and toId = $1)) AND status = 0;",
			[from, session.userId]
		);
		if (!exists.rowCount) return {result: "request not found"};
		let result = await pg.query(
			"DELETE FROM friends WHERE fromId = $1 AND toId = $2;",
			[from, session.userId]
		);
		return {result: "request declined", declined: true};
	} catch (error) {
		console.log(error);
		return {result: "error"};
	}
}
async function cancelRequests(to, session) {
	if (!session.username || ! session.userId) return {logout: true};
	try {
		let exists = await pg.query(
			"SELECT * FROM friends WHERE ((fromId = $1 and toId = $2) OR (fromId = $2 and toId = $1)) AND status = 0;",
			[to, session.userId]
		);
		if (!exists.rowCount) return {result: "request not found"};
		let result = await pg.query(
			"DELETE FROM friends WHERE toId = $1 AND fromId = $2;",
			[to, session.userId]
		);
		return {result: "request cancelled", cancelled: true};
	} catch (error) {
		console.log(error);
		return {result: "error"};
	}
}
async function unfriend(friend, session) {
	if (!session.username || ! session.userId) return {logout: true};
	try {
		let exists = await pg.query(
			"SELECT * FROM friends WHERE ((fromId = $1 and toId = $2) OR (fromId = $2 and toId = $1)) AND status = 1;",
			[friend, session.userId]
		);
		if (!exists.rowCount) return {result: "friend not found"};
		let result = await pg.query(
			"DELETE FROM friends WHERE (fromId = $1 AND toId = $2) OR (fromId = $2 AND toId = $1);",
			[friend, session.userId]
		);
		return {result: "friend removed", removed: true};
	} catch (error) {
		console.log(error);
		return {result: "error"};
	}
}
async function friends(session) {
	if (!session.username || ! session.userId) return {logout: true};
	try {
		let friendsFrom = await pg.query("SELECT users.id, users.username FROM friends INNER JOIN users ON users.id = friends.toId WHERE friends.fromId = $1 AND friends.status = 1;", [session.userId]);
		let friendsTo = await pg.query("SELECT users.id, users.username FROM friends INNER JOIN users ON users.id = friends.fromId WHERE friends.toId = $1 AND friends.status = 1;", [session.userId]);
		return {result: "success", friends: friendsTo.rows.concat(friendsFrom.rows)};
	} catch(error) {
		console.log(error);
		return {result: "error"};
	}
}

//routes
router.post("/create/", async (req, res) => {
	let username = req.body.username;
	let password = req.body.password;
	let result = await create(username, password);
	setSessionLogin(result, req.session);
	res.json(result);
});
router.post("/change-username/", async (req, res) => {
	let username = req.body.username;
	let result = await changeUsername(username, req.session);
	setSessionLogin(result, req.session);
	res.json(result);
});
router.post("/change-password/", async (req, res) => {
	let passwordOld = req.body.passwordOld;
	let passwordNew = req.body.passwordNew;
	let result = await changePassword(passwordOld, passwordNew, req.session);
	res.json(result);
});
router.post("/login/", async (req, res) => {
	let username = req.body.username;
	let password = req.body.password;
	let result = await login(username, password);
	if (req.body.remember || true) req.session.cookie.maxAge = 30 * 24 * 60 * 60;
	setSessionLogin(result, req.session);
	res.json(result);
});
router.post("/logout/", (req, res) => {
	setSessionLogin(null, req.session);
	res.json({result: "logged out", login: false});
});
router.get("/status/", async (req, res) => {
	let result = await status(req.session);
	res.json(result);
});
//friend routes
router.post("/request/", async (req, res) => {
	let to = req.body.to;
	let result = await request(to, req.session);
	res.json(result);
});
router.get("/requestings/", async (req, res) => {
	let result = await checkRequestings(req.session);
	res.json(result);
});
router.get("/requests/", async (req, res) => {
	let result = await checkRequests(req.session);
	res.json(result);
});
router.post("/accept/", async (req, res) => {
	let from = req.body.from;
	let result = await acceptRequest(from, req.session);
	res.json(result);
});
router.post("/decline/", async (req, res) => {
	let from = req.body.from;
	let result = await declineRequest(from, req.session);
	res.json(result);
});
router.post("/cancel/", async (req, res) => {
	let to = req.body.to;
	let result = await cancelRequests(to, req.session);
	res.json(result);
});
router.delete("/remove/", async (req, res) => {
	let friend = req.body.friend;
	let result = await unfriend(friend, req.session);
	res.json(result);
});	
router.get("/friends/", async (req, res) => {
	let result = await friends(req.session);
	res.json(result);
});

module.exports = router;