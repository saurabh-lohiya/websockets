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
let lastFileSize = 0

app.use("/", express.static(path.join(__dirname, "public")))

// Send last 10 lines on initial connection
io.on("connection", (socket) => {
	readLastNLines(10)
		.then((lines) => socket.emit("logUpdate", lines))
		.catch((err) => console.error("Error reading log file:", err))
})

async function readNewLines(): Promise<string[]> {
	const stream = fs.createReadStream(logFile, { start: lastFileSize })
	let newLines: string[] = []

	return new Promise((resolve, reject) => {
		stream.on("data", (chunk) => {
			const lines = chunk.toString().split("\n")
			// @ts-ignore
			newLines.push(...lines.slice(0, -1)) // Skip the last incomplete line
		})
		stream.on("end", () => {
			resolve(newLines)
		})
		stream.on("error", (err) => {
			reject(err)
		})
	})
}

fs.watchFile(logFile, (curr, prev) => {
	if (curr.size !== prev.size) {
		readNewLines()
			.then((lines) => {
				io.emit("logUpdate", lines)
				lastFileSize = curr.size // Update lastFileSize
			})
			.catch((err) => console.error("Error reading file:", err))
	}
})

server.listen(3000, () => {
	console.log("Server listening on port 3000")
})
