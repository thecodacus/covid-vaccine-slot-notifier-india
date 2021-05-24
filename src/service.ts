import { config } from "./config";
import * as https from "https";
import { BehaviorSubject, interval, Observable, Subject } from "rxjs";
import { map, switchMap, takeUntil } from "rxjs/operators";
export interface IServiceConfig {
	start: string;
	end: string;
	pin: number;
	age: {
		"18": boolean;
		"45": boolean;
	};
	vaccine: {
		covishild: boolean;
		covaxin: boolean;
		sputnik: boolean;
	};
	price: {
		free: boolean;
		paid: boolean;
	};
}
export class MonitoringService {
	isRunning: boolean = false;
	serviceConfig: IServiceConfig;
	private parameterReceived: Subject<IServiceConfig>;
	private serviceInt: Subject<boolean> = new Subject();
	private serviceStatusUpdateSub: BehaviorSubject<{ serviceConfig: IServiceConfig; results: any }>;
	serviceStatusUpdate: Observable<{ serviceConfig: IServiceConfig; results: any }>;
	constructor() {
		this.parameterReceived = new Subject();
		this.serviceStatusUpdateSub = new BehaviorSubject(null);
		this.serviceStatusUpdate = this.serviceStatusUpdateSub.asObservable();
	}
	startService(serviceConfig: IServiceConfig) {
		this.parameterReceived
			.pipe(
				switchMap((serviceConfig) => interval(20000).pipe(map((x) => serviceConfig))),
				takeUntil(this.serviceInt)
			)
			.subscribe((serviceConfig) => this.serviceLoop(serviceConfig));
		this.parameterReceived.next(serviceConfig);
		this.isRunning = true;
		this.serviceConfig = serviceConfig;
	}
	stopService() {
		this.serviceInt.next(true);
		this.isRunning = false;
		this.serviceConfig = null;
		this.serviceStatusUpdateSub.next(null);
	}
	private async serviceLoop(serviceConfig: IServiceConfig) {
		this.isRunning = true;
		this.serviceConfig = serviceConfig;
		let startDate = new Date(serviceConfig.start);
		let endDate = new Date(serviceConfig.end);
		let dates: Date[] = [];
		for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
			dates.push(date);
		}
		let resultsPrms = dates.map((date) => {
			return new Promise((resolve, reject) => {
				let url = config.getUrl(serviceConfig.pin, date);
				let req = https.get(url, (res) => {
					res.on("data", (body) => {
						resolve({ date, ...JSON.parse(body) });
					});
					res.on("error", (err) => {
						reject(err);
					});
				});
				req.on("error", (err) => {
					reject(err);
				});
				req.end();
			}).catch((err) => {
				console.log(err);
				return null;
			});
		});
		let results = await Promise.all(resultsPrms);
		this.serviceStatusUpdateSub.next({ serviceConfig, results });
	}
}
