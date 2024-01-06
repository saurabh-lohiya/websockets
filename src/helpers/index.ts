import fs from "fs"
const logFile = "updates.log"

export function truncateLine(line: string) {
	const maxLineLength = 20 // Adjust as needed
	return line.length > maxLineLength
		? line.slice(0, maxLineLength) + "..."
		: line
}

export async function readLastNLines(n: number) {
	let i = 1
	while (i < 20) {
		const stats = await fs.promises.stat(logFile)
		const fileSize = stats.size
		const stream = fs.createReadStream(logFile, {
			start: Math.max(0, fileSize - 100 * n * i),
		}) // Start reading from the last 1000 bytes
		let lastLines: string[] = [] // Specify the type of the 'lastLines' array

		for await (const chunk of stream) {
			const lines: string[] = chunk.toString().split("\n") // Specify the type of the 'lines' array
			lastLines.push(...lines.reverse().slice(0, n)) // Get last 10 lines in correct order
			if (lastLines.length === n) {
				break // Stop reading once we have 10 lines
			}
		}
		if (lastLines.length === n) {
			lastLines = lastLines.map(truncateLine)
			return lastLines.reverse() // Reverse to get original order
		} else {
			i++
		}
	}
}
