async function fetchPost(resource, body) {
	if (!body) body = {};
	let response = await fetch(resource, {
		credentials: "include",
		method: "POST",
		headers: {"Accept": "application/json", "Content-Type": "application/json"},
		body: JSON.stringify(body),
	});
	let json = await response.json();
	return json;
}
async function fetchDelete(resource, body) {
	if (!body) body = {};
	let response = await fetch(resource, {
		credentials: "include",
		method: "DELETE",
		headers: {"Accept": "application/json", "Content-Type": "application/json"},
		body: JSON.stringify(body),
	});
	let json = await response.json();
	return json;
}
async function fetchPut(resource, body) {
	if (!body) body = {};
	let response = await fetch(resource, {
		credentials: "include",
		method: "PUT",
		headers: {"Accept": "application/json", "Content-Type": "application/json"},
		body: JSON.stringify(body),
	});
	let json = await response.json();
	return json;
}
async function fetchGet(resource, body) {
	if (!body) body = {};
	let params = new URLSearchParams(body);
	let response = await fetch(resource + "?" + params, {
		credentials: "include",
		method: "GET",
		headers: {"Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded"},
	});
	let json = await response.json();
	return json;
}

function getPath() {
	let path = window.location.pathname;
	if (path[0] == "/") path = path.substring(1);
	if (path[path.length - 1] == "/") path = path.substring(0, path.length - 1);
	return path.split("/");
}
function getParams() {
	return new URLSearchParams(window.location.search);
}