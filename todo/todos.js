const express = require("express");
const router = express.Router();

//check login
router.use((req, res, next) => {
	if (!req.session.username || ! req.session.userId) {
		res.json({logout: true});
		return;
	}
	next();
});

//connect
const Pool = require("pg").Pool;
const pg = new Pool({
	connectionString: process.env.DATABASE_URL,
});

//functions
async function add(content, date, session) {
	content = content.trim().substring(0, 255);
	if (content.length == 0) return {result: "empty"};
	try {
		let res;
		if (date) {
			res = await pg.query(
				"INSERT INTO todos (userId, content, status, date) VALUES ($1, $2, 0, $3);",
				[session.userId, content, date]
			);
		} else {
			res = await pg.query(
				"INSERT INTO todos (userId, content, status) VALUES ($1, $2, 0);",
				[session.userId, content]
			);
		}
		return {result: "added", added: true};
	} catch (error) {
		console.log(error);
		return {result: "error"};
	}
}
async function list(rows, hide, session) {
	if (!rows) rows = 10;
	rows = Math.ceil(rows * 0.1) * 10;
	try {
		let lines;
		let todos;
		let more;
		let sql;
		if (hide) {
			sql = `SELECT users.username AS username, todos.id, users.id AS userId, todos.content, todos.status, todos.date, '' AS friend FROM todos 
				INNER JOIN users ON todos.userId = users.id
				WHERE userId = $1 
				ORDER BY date DESC, id DESC`;
		} else {
			sql = `(SELECT users.username AS username, todos.id, users.id AS userId, todos.content, todos.status, todos.date, '' AS friend FROM todos 
				INNER JOIN users ON todos.userId = users.id
				WHERE userId = $1 
				UNION
				SELECT users.username AS username, todos.id AS id, todos.userId AS userId, todos.content AS content, todos.status AS status, todos.date AS date, 'friend' AS friend FROM todos 
				INNER JOIN users ON todos.userId = users.id 
				INNER JOIN friends ON (users.id = friends.fromId OR users.id = friends.toId) 
				WHERE (friends.fromId = $1 OR friends.toId = $1) 
				AND todos.userId != $1 
				AND friends.status = 1)
				ORDER BY date DESC, id DESC`;
		}
		lines = await pg.query(sql + ";", [session.userId]);
		more = lines.rows.length > rows;
		todos = await pg.query(sql + " LIMIT $2;", [session.userId, rows]);
		return {result: "success", todos: todos.rows, more: more};
	} catch (error) {
		console.log(error);
		return {result: "error"};
	}
}
async function done(todoId, session) {
	try {
		let res = await pg.query("UPDATE todos SET status = 1 WHERE id = $1 AND userId = $2;", [todoId, session.userId]);
		return {result: "done"};
	} catch (error) {
		console.log(error);
		return {result: "error"};
	}
}
async function del(todoId, session) {
	try {
		let res = await pg.query("DELETE FROM todos WHERE id = $1 AND userId = $2;", [todoId, session.userId]);
		return {result: "done", deleted: true};
	} catch (error) {
		console.log(error);
		return {result: "error"};
	}
}

//routes
router.post("/add/", async (req, res) => {
	let content = req.body.content;
	let date = req.body.date;
	let result = await add(content, date, req.session);
	res.json(result);
});
router.get("/list/", async (req, res) => {
	let rows = parseInt(req.query.rows, 10);
	let hideFriend = req.query.hideFriend == "true";
	let result = await list(rows, hideFriend, req.session);
	res.json(result);
});
router.post("/done/", async (req, res) => {
	let todoId = req.body.todoId;
	let result = await done(todoId, req.session);
	res.json(result);
});
router.delete("/del/", async (req, res) => {
	let todoId = req.body.todoId;
	let result = await del(todoId, req.session);
	res.json(result);
});

module.exports = router;