#!/usr/bin/env node
import { spawn } from "node:child_process";

const args = process.argv.slice(2);

function runStage(stage) {
	const cmdArgs = ["./src/packs.mjs", "package", stage, ...args];
	const child = spawn(process.execPath, cmdArgs, { stdio: "inherit" });

	return new Promise((resolve, reject) => {
		child.on("exit", (code, signal) => {
			if (signal) {
				reject(new Error(`stage ${stage} terminated with signal ${signal}`));
			} else if (code !== 0) {
				reject(new Error(`stage ${stage} exited with code ${code}`));
			} else {
				resolve();
			}
		});
		child.on("error", reject);
	});
}

(async function main() {
	try {
		await runStage("clean");
		await runStage("pack");
	} catch (err) {
		console.error(err.message);
		process.exitCode = 1;
	}
})();
