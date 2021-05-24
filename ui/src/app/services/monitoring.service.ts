import { Injectable } from '@angular/core';
import { interval, Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { IConfig } from '../interfaces/config.interface';
import { IpcService } from './ipc.service';

@Injectable({
  providedIn: 'root',
})
export class MonitoringService {
  public serviceStatus: Observable<{ on: boolean; serviceConfig: IConfig }>;
  public statusUpdate: Observable<{
    serviceConfig: IConfig;
    results: { date: Date; sessions: any[] }[];
  }>;
  constructor(private ipc: IpcService) {
    interval(10000).subscribe((x) => {
      this.ipc.sendMessage('status-query', null);
    });
    this.serviceStatus = this.ipc.getChannel('service-status');
    this.statusUpdate = this.ipc.getChannel('status-update');
  }
  startService(data: IConfig) {
    this.ipc.sendMessage('service-start', data);
  }
  stopService() {
    this.ipc.sendMessage('service-stop', null);
  }
}
