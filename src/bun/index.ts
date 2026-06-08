import { BrowserWindow, BrowserView, Updater } from "electrobun/bun";
import type { WindowRPCType } from "../shared/types";

const DEV_SERVER_PORT = 3000;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") {
		try {
			await fetch(DEV_SERVER_URL, { method: "HEAD" });
			console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
			return DEV_SERVER_URL;
		} catch {
			console.log(
				"dev server not running.",
			);
		}
	}
	return "views://mainview/index.html";
}

const windowRPC = BrowserView.defineRPC<WindowRPCType>({
	handlers: {
		requests: {},
		messages: {
			closeWindow: () => {
				process.exit(0);
			},
			minimizeWindow: () => {
				// Handled by BrowserWindow
			},
			maximizeWindow: () => {
				// Handled by BrowserWindow
			},
		},
	},
});

const url = await getMainViewUrl();

const mainWindow = new BrowserWindow({
	title: "dawn-term",
	url,
	frame: {
		width: 900,
		height: 700,
		x: 200,
		y: 200,
	},
	titleBarStyle: "hiddenInset",
	rpc: windowRPC,
});

console.log("Tailwind Vanilla app started!");
