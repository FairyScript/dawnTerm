import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "tailwind-vanilla",
		identifier: "tailwindvanilla.electrobun.dev",
		version: "0.0.1",
	},
	build: {
		copy: {
			"dist": "views/mainview",
		},
		watchIgnore: ["dist/**"],
		mac: {
			bundleCEF: false,
		},
		linux: {
			bundleCEF: false,
		},
		win: {
			bundleCEF: false,
		},
	},
} satisfies ElectrobunConfig;
