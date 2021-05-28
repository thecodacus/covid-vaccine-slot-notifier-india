import { BrowserWindow, Menu, Tray,Notification } from "electron";
import { ipcMain } from "electron";
const path = require("path");
const open = require('open');
import { MonitoringService } from "./service";
const notifier = require('node-notifier');


export default class Main {
	static title:string;
	static mainWindow: Electron.BrowserWindow;
	static application: Electron.App;
	static BrowserWindow:typeof BrowserWindow;
	static monitor: MonitoringService;
	static statusQuery;
	static tray: Electron.Tray;
	static renderarPath = `${__dirname}/ui`;
	static notifiedCenters:any;
	
	static openDevTool(){
		Main.mainWindow.webContents.openDevTools()
	};
	private static onWindowAllClosed() {
		if (process.platform !== "darwin") {
			Main.application.quit();
		}
	}

	private static onClose() {
		// Dereference the window object.
		// Main.mainWindow.hide()
		if (!Main.mainWindow) Main.mainWindow.close()
		Main.application.dock.hide()
	}

	private static onReady() {
		Main.createWindow();
		Main.setuptray();
		Main.initiateIpc();
	}
	private static async createWindow(){
		Main.mainWindow = new Main.BrowserWindow({
			width: 800,
			height: 680,
			icon:`${__dirname}/../assets/icon.icns`,
			title:Main.title,
			webPreferences: {
				nodeIntegration: true,
				enableRemoteModule: true,
				contextIsolation: false,
			},
		});
		Main.mainWindow.loadFile(Main.renderarPath+"/index.html");
		

		// Main.mainWindow.webContents.openDevTools();
		Main.mainWindow.on("closed",()=>{
			Main.onClose()
		} );
		// Emitted when the window is closed.
		Main.mainWindow.once("ready-to-show", () => {
			Main.mainWindow.show();
		});
		// Main.mainWindow.on("blur", () => {
		// 	Main.mainWindow.hide();
		// });
		// Main.mainWindow.setAlwaysOnTop(true, "floating", 1);
		// Main.mainWindow.setVisibleOnAllWorkspaces(true, {
		// 	visibleOnFullScreen: true,
		// });
	}
	private static async openWindow() {
		// await Main.application.dock.show()
		if(Main.mainWindow==undefined) await Main.createWindow()
		else if(Main.mainWindow&&Main.mainWindow.isDestroyed()){
				Main.createWindow()
		}
		else {
			Main.mainWindow.show();
			Main.mainWindow.focus();
		}
	}
	private static showNotification (title:string,body:string) {
		let notification=new Notification({
			title,
			body,
		}).on("click",()=>{Main.openWindow()})

		notification.show()
		
		// Object
		// notifier.notify({
		// 	title,
		// 	message:body,
		// 	sound: true
		// })
		// notifier.on('click', (notifierObject, options, event)=>{
		// 	Main.openWindow()
		// })
	}
	private static initiateIpc() {
		ipcMain.on("handshake", (event, arg) => {
			console.log("handshake from UI", arg);
			event.sender.send("handshakeAck", arg);
		});
		ipcMain.on("service-start", (event, arg) => {
			console.log("Starting service", arg);
			Main.monitor.startService(arg);
			Main.notifiedCenters={};
		});
		ipcMain.on("service-stop", (event, arg) => {
			console.log("Stopping service");
			Main.monitor.stopService();
		});
		ipcMain.on("status-query", (event, arg) => {
			event.sender.send("service-status", { on: this.monitor.isRunning, serviceConfig: this.monitor.serviceConfig });
		});
		this.monitor.serviceStatusUpdate.subscribe((x) => {
			if(Main.mainWindow&&Main.mainWindow.isDestroyed()==false) Main.mainWindow.webContents.send("status-update", x);
			if(x==undefined)return;
			x.results.forEach(val=>{
				if(val.total>0){
					let name= "";
					let date=""
					let centers=val.centers.filter(c=>c.sessions.reduce((a,v)=>a+v.available_capacity_dose1+v.available_capacity_dose2,0)>0)
					if(centers.length>0){
						name=`at ${centers[0].name}`
						date=`${centers[0].sessions.filter(s=>s.available_capacity_dose1>0||s.available_capacity_dose2>0)[0].date}`
					}
					if(Main.notifiedCenters[`${name}-${date}`])return;
					Main.notifiedCenters[`${name}-${date}`]="send";
					Main.showNotification("Vaccine Available",`Vaccine Available on ${val.sessions[0].date} ${name}` )
				}
			})
		});
	}
	private static setuptray() {
		try {
			console.log("setting up tray");

			Main.tray = new Tray(
				path.join(Main.renderarPath, "/assets/tray.png")
			);
			const contextMenu = Menu.buildFromTemplate([
				{ label: "Open", type: "normal", click: () =>  Main.openWindow()},
				{ label: "About", type: "normal", click: () =>  open("https://anirbankar.info")},
				{ type: "separator" },
				//{ label: 'reload', type: 'normal', click:reload},
				{ label: "Open Dev Tools", type: "normal", click: Main.openDevTool },
				{ type: "separator" },
				{ label: "Quit YANC", type: "normal", click: () => Main.application.quit() },
			]);
			Main.tray.setToolTip("Yet Another Notifier for Cowin");
			Main.tray.setContextMenu(contextMenu);
		} catch (error) {
			console.log(error);
		}
	}
	static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
		// we pass the Electron.App object and the
		// Electron.BrowserWindow into this function
		// so this class has no dependencies. This
		// makes the code easier to write tests for
		Main.title="Yanc"
		Main.BrowserWindow = browserWindow;
		Main.application = app;
		Main.monitor = new MonitoringService();
		Main.application.on("window-all-closed", Main.onWindowAllClosed);
		Main.application.on("ready", Main.onReady);
	}
}
