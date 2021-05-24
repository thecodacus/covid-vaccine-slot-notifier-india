import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class IpcService {
  private sendToElectron: Subject<{ topic: string; message: any }> =
    new Subject();
  private receivedFromElectron: Subject<{ topic: string; message: any }> =
    new Subject();
  public receivedMessage: Observable<{ topic: string; message: any }>;
  private connectedChannels: { [channel: string]: Subject<any> } = {};

  constructor(private electronSvc: ElectronService) {
    this.receivedMessage = this.receivedFromElectron.asObservable();
    if (this.electronSvc.isElectronApp) {
      try {
        this.electronSvc.ipcRenderer.on('handshakeAck', (event, payload) => {
          console.log('Handshake Ack from Host', payload);
        });
        this.sendToElectron
          .pipe(filter((x) => x !== undefined))
          .subscribe((payload) => {
            console.log('sending:', payload);
            if (payload)
              this.electronSvc.ipcRenderer.send(
                `${payload.topic}`,
                payload.message
              );
          });
        this.sendMessage('handshake', 'test');
      } catch (e) {
        throw e;
      }
    } else {
      console.warn("Electron's IPC was not loaded");
    }
  }
  sendMessage(topic: string, message: any) {
    this.sendToElectron.next({ topic, message });
  }
  getChannel(topic: string) {
    this.connectedChannels[topic] = new Subject();
    this.electronSvc.ipcRenderer.on(topic, (event, payload) => {
      this.connectedChannels[topic].next(payload);
    });
    return this.connectedChannels[topic].asObservable();
  }
}
