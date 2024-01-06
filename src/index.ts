import express from "express"
import http from "http"
import fs from "fs"
import { Server } from "socket.io"
import path from "path"
import { readLastNLines } from "./helpers"
import * as readline from "readline"

const app = express()
const server = http.createServer(app)
const io = new Server(server)

const logFile = "updates.log"

app.use("/", express.static(path.join(__dirname, "public")))

// Send last 10 lines on initial connection
io.on("connection", (socket) => {
	readLastNLines(10)
		.then((lines) => socket.emit("logUpdate", lines))
		.catch((err) => console.error("Error reading log file:", err))
})

let lastLineRead = 0

// Watch for file changes and emit updates
fs.watch(logFile, (event) => {
	console.log(event)
	if (event === "change") {
		const rl = readline.createInterface({
			input: fs.createReadStream(logFile, { start: lastLineRead }),
			crlfDelay: Infinity,
		})
		let lastLines: string[] = []
		console.log(lastLineRead)
		rl.on("line", (line) => {
			console.log(line)
			lastLineRead += Buffer.byteLength(line, "utf8") + 1 // +1 for the newline character
			lastLines.push(line)
		})
		console.log(lastLines)
		io.emit("logUpdate", lastLines)
	}
})

server.listen(3000, () => {
	console.log("Server listening on port 3000")
})
