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

let mainWindow: BrowserWindow | null = null;

const windowRPC = BrowserView.defineRPC<WindowRPCType>({
	handlers: {
		requests: {},
		messages: {
			closeWindow: () => {
				process.exit(0);
			},
			minimizeWindow: () => {
				mainWindow?.minimize();
			},
			maximizeWindow: () => {
				if (mainWindow?.isMaximized()) {
					mainWindow.unmaximize();
				} else {
					mainWindow?.maximize();
				}
			},
		},
	},
});

const url = await getMainViewUrl();

mainWindow = new BrowserWindow({
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

mainWindow.on("move", () => {
	if (mainWindow?.isMaximized()) {
		mainWindow.unmaximize();
	}
});

console.log("Tailwind Vanilla app started!");
