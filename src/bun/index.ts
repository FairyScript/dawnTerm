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
			startWindowDrag: ({ mouseX, mouseY }: { mouseX: number; mouseY: number }) => {
				if (mainWindow?.isMaximized()) {
					// 获取当前窗口尺寸（最大化后的尺寸）
					const currentFrame = mainWindow.getFrame();
					// 恢复后的宽度和高度（使用初始配置的尺寸）
					const restoredWidth = 900;
					const restoredHeight = 700;

					// 计算鼠标在标题栏的相对位置（假设标题栏高度 32px）
					// 鼠标相对于窗口左边的偏移
					const relativeX = mouseX - currentFrame.x;
					// 计算鼠标在标题栏中的相对位置比例
					const ratioX = relativeX / currentFrame.width;

					// 计算新窗口位置，使鼠标在恢复后的窗口中保持相同相对位置
					const newX = Math.round(mouseX - restoredWidth * ratioX);
					const newY = Math.round(mouseY - 16); // 标题栏高度约 32px，鼠标在中间

					mainWindow.unmaximize();
					mainWindow.setFrame(newX, newY, restoredWidth, restoredHeight);
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
	titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
	rpc: windowRPC,
});

console.log("Tailwind Vanilla app started!");

mainWindow.webview.on('dom-ready', () => {
	// 修复窗口布局问题
	fixWindowLayout(mainWindow!);
});

function fixWindowLayout(mainWindow: BrowserWindow) {
	const { width, height } = mainWindow.getFrame();
	mainWindow.setSize(width, height + 1);
	setTimeout(() => {
		mainWindow.setSize(width, height);
	}, 50);
}