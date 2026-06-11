import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private config: any = {};

  constructor(private http: HttpClient) {}

  loadConfig() {
    return firstValueFrom(this.http.get('/assets/env.json'))
      .then(config => {
        this.config = config;
      })
      .catch(error => {
        console.error('Error loading config:', error);
      });
  }

  get backendUrl(): string {
    return this.config.backendUrl || '';
  }
}
