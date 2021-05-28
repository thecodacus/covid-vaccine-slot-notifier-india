import { config } from "./config";
import * as https from "https";
import { BehaviorSubject, interval, Observable, Subject } from "rxjs";
import { map, switchMap, takeUntil } from "rxjs/operators";
import { ICenterSlot, ISessionSlot, VaccineName } from "./models/slot.interface";
export interface IServiceConfig {
	start: Date;
	end: Date;
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
export interface IReport{sessions:ISessionSlot[],centers?:ICenterSlot[],dose1:number,dose2:number,total:number}
export class MonitoringService {
	isRunning: boolean = false;
	serviceConfig: IServiceConfig;
	private parameterReceived: Subject<IServiceConfig>;
	private serviceInt: Subject<boolean> = new Subject();
	private serviceStatusUpdateSub: BehaviorSubject<{ serviceConfig: IServiceConfig; results: any }>;
	serviceStatusUpdate: Observable<{ serviceConfig: IServiceConfig; results: IReport[] }>;
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
		for (let date = new Date(startDate); date <= endDate;  date.setDate(date.getDate() + 1)) {
			dates.push(new Date(date));
		}
		let resultsPrms = dates.map((date) => {
			return new Promise<{sessions?:ISessionSlot[],centers?:ICenterSlot[]}>((resolve, reject) => {
				let url = config.getUrl(serviceConfig.pin, date);
				console.log(url);
				
				let req = https.get(url, (res) => {
					res.on("data", (body) => {
						let resp=null;
						try{
							resp=JSON.parse(body)
						}
						catch(err){
							console.log("error parsing boddy",body);
						}
						resolve({ date, ...resp });
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
		let results:{sessions:ISessionSlot[],centers?:ICenterSlot[],dose1:number,dose2:number,total:number}[] = await Promise.all(resultsPrms);
		console.log(results);
		
		results=results.map(x=>{
			if(x.sessions==undefined)x.sessions=[]
			if(x.centers==undefined)x.centers=[]
			x.centers.forEach(center=>{
				center.sessions.map(x=>{
					x.fee_type=center.fee_type;
					return x
				})
				x.sessions=x.sessions.concat(center.sessions)
			})
			
			if(x.sessions){	
				x.sessions=x.sessions.filter(s=>{
					let filterPrice=false;
					filterPrice=filterPrice||s.fee_type=="Free"&&serviceConfig.price.free
					filterPrice=filterPrice||s.fee_type=="Paid"&&serviceConfig.price.paid
					let filterVxn=false;
					filterVxn=filterVxn||s.vaccine==VaccineName.Covishild &&serviceConfig.vaccine.covishild
					filterVxn=filterVxn||s.vaccine==VaccineName.Covaxin &&serviceConfig.vaccine.covaxin
					filterVxn=filterVxn||s.vaccine==VaccineName.Sputnik &&serviceConfig.vaccine.sputnik
					let filterAge=false;
					filterAge=filterAge||s.min_age_limit==18 &&serviceConfig.age["18"]
					filterAge=filterAge||s.min_age_limit==45 &&serviceConfig.age["45"]
					return filterPrice&&filterVxn&&filterAge
				})
			}
			x.dose1=x.sessions.reduce((a,v)=>a+v.available_capacity_dose1,0)
			x.dose2=x.sessions.reduce((a,v)=>a+v.available_capacity_dose2,0)
			x.total=x.dose1+x.dose2
			return x
		})
		this.serviceStatusUpdateSub.next({ serviceConfig, results });
	}
}
