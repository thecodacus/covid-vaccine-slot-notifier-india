import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IConfig } from './interfaces/config.interface';
import { IpcService } from './services/ipc.service';
import { MonitoringService } from './services/monitoring.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  form = new FormGroup({
    start: new FormControl(null, [Validators.required]),
    end: new FormControl(null, [Validators.required]),
    pin: new FormControl(null, [Validators.required]),
    age: new FormGroup({
      '18': new FormControl(),
      '45': new FormControl(),
    }),
    vaccine: new FormGroup({
      covishild: new FormControl(),
      covaxin: new FormControl(),
      sputnik: new FormControl(),
    }),
    price: new FormGroup({
      free: new FormControl(),
      paid: new FormControl(),
    }),
  });
  title = 'CoWin Vaccine Notifier - Powered By Codacus (thecodacus@gtmail.com)';
  public statusLable: string = '';
  public isRunning: boolean = false;
  public statusUpdate: Observable<{
    serviceConfig: IConfig;
    results: MatTableDataSource<{ date: Date; sessions: any[] }>;
  }>;
  @ViewChild(MatPaginator, { static: false })
  public paginator!: MatPaginator;
  constructor(
    private titleSvc: Title,
    private monSvc: MonitoringService,
    private snackBar: MatSnackBar
  ) {
    this.updateStatus();
    this.titleSvc.setTitle(this.title);
    // this.ipcSvc.sendMessage('ping', 'test');
    this.form.valueChanges.subscribe((val) => {
      console.log(val);
    });
    this.monSvc.serviceStatus.subscribe((val) => {
      this.isRunning = val.on;
      console.log(val.serviceConfig);
    });
    this.statusUpdate = this.monSvc.statusUpdate.pipe(
      map((x) => {
        let dataSource = new MatTableDataSource<{
          date: Date;
          sessions: any[];
        }>(x.results);
        dataSource.paginator = this.paginator;
        return {
          serviceConfig: x.serviceConfig,
          results: dataSource,
        };
      })
    );
  }
  toggleService() {
    console.log('toggling service');

    if (this.isRunning) {
      this.isRunning = !this.isRunning;
      this.updateStatus();
      return this.monSvc.stopService();
    }

    if (this.form.valid) {
      this.isRunning = !this.isRunning;
      this.updateStatus();
      return this.monSvc.startService(this.form.value);
    }

    if (!this.form.valid)
      return this.snackBar.open(
        'Invalid Inputs, try again with valid Inputs',
        '',
        { duration: 5000 }
      );
  }
  formatConfig(obj: IConfig) {
    return `
    Start date: ${obj.start.toLocaleDateString()}
    End date: ${obj.end.toLocaleDateString()}
    End date: ${obj.pin}
    Price: ${obj.price.free ? 'free' : ''}${obj.price.paid ? ', paid' : ''}
    Age: ${obj.age['18'] ? '18' : ''}${obj.age ? ', 45+' : ''}
    Vaccine: ${obj.vaccine.covaxin ? 'Covaxin' : ''}${
      obj.vaccine.covishild ? ', Covishild' : ''
    }${obj.vaccine.sputnik ? ', Sputnik' : ''}
    `;
  }
  updateStatus() {
    if (this.isRunning) this.statusLable = 'Monitoring';
    else this.statusLable = 'Monitoring Stopped';
  }
}
