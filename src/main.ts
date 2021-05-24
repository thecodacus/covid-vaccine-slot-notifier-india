import { BrowserWindow } from "electron";
import { ipcMain } from "electron";
import { MonitoringService } from "./service";

export default class Main {
	static mainWindow: Electron.BrowserWindow;
	static application: Electron.App;
	static BrowserWindow;
	static monitor: MonitoringService;
	static statusQuery;
	private static onWindowAllClosed() {
		if (process.platform !== "darwin") {
			Main.application.quit();
		}
	}

	private static onClose() {
		// Dereference the window object.
		Main.mainWindow = null;
	}

	private static onReady() {
		Main.mainWindow = new Main.BrowserWindow({
			width: 800,
			height: 680,
			webPreferences: {
				nodeIntegration: true,
				enableRemoteModule: true,
				contextIsolation: false,
			},
		});
		if (process.env.ELECTRON_SERVE) {
			Main.mainWindow.loadURL("localhost:4200");
		} else {
			Main.mainWindow.loadFile(__dirname + "/ui/index.html");
		}

		// Main.mainWindow.webContents.openDevTools();
		Main.mainWindow.on("closed", Main.onClose);
		Main.initiateIpc();
	}
	private static initiateIpc() {
		ipcMain.on("handshake", (event, arg) => {
			console.log("handshake from UI", arg);
			event.sender.send("handshakeAck", arg);
		});
		ipcMain.on("service-start", (event, arg) => {
			console.log("Starting service", arg);
			Main.monitor.startService(arg);
		});
		ipcMain.on("service-stop", (event, arg) => {
			console.log("Stopping service");
			Main.monitor.stopService();
		});
		ipcMain.on("status-query", (event, arg) => {
			event.sender.send("service-status", { on: this.monitor.isRunning, serviceConfig: this.monitor.serviceConfig });
		});
		this.monitor.serviceStatusUpdate.subscribe((x) => {
			Main.mainWindow.webContents.send("status-update", x);
		});
	}

	static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
		// we pass the Electron.App object and the
		// Electron.BrowserWindow into this function
		// so this class has no dependencies. This
		// makes the code easier to write tests for
		Main.BrowserWindow = browserWindow;
		Main.application = app;
		Main.monitor = new MonitoringService();
		Main.application.on("window-all-closed", Main.onWindowAllClosed);
		Main.application.on("ready", Main.onReady);
	}
}
