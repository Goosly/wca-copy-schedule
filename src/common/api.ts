import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../environments/environment';
import {LogglyService} from '../loggly/loggly.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  public oauthToken;
  private headerParams: HttpHeaders;
  private logglyService: LogglyService;

  constructor(private httpClient: HttpClient) {
    this.getToken();

    this.headerParams = new HttpHeaders();
    this.headerParams = this.headerParams.set('Authorization', `Bearer ${this.oauthToken}`);
    this.headerParams = this.headerParams.set('Content-Type', 'application/json');

    this.initLoggly();
  }

  private initLoggly() {
    this.logglyService = new LogglyService(this.httpClient);
    this.logglyService.push({
      logglyKey: '3c4e81e2-b2ae-40e3-88b5-ba8e8b810586',
      sendConsoleErrors: false,
      tag: 'wca-copy-schedule'
    });
  }

  private getToken(): void {
    const hash = window.location.hash.slice(1, window.location.hash.length -1);
    const hashParams = new URLSearchParams(hash);
    if (hashParams.has('access_token')) {
      this.oauthToken = hashParams.get('access_token');
    }
  }

  logIn(): void {
    window.location.href = `${environment.wcaUrl}/oauth/authorize?client_id=${environment.wcaAppId}&redirect_uri=${environment.appUrl}&response_type=token&scope=manage_competitions`;
  }

  getCompetitions(): Observable<any> {
    let url = `${environment.wcaUrl}/api/v0/competitions?managed_by_me=true`;
    url += `&per_page=1000`;
    return this.httpClient.get(url, {headers: this.headerParams});
  }

  getWcif(competitionId): Observable<any> {
    return this.httpClient.get(`${environment.wcaUrl}/api/v0/competitions/${competitionId}/wcif`,
      {headers: this.headerParams});
  }

  submitEventsAndSchedule(competitionId: string, wcifToCopy: any, doneHandler: () => void, errorHandler: (error) => void): void {
    this.getWcif(competitionId).subscribe(wcif => {
      this.copyEvents(wcif, wcifToCopy);
      this.copyVenueAndRooms(wcif, wcifToCopy);

      const replaceDates = this.buildReplaceDates(wcifToCopy, wcif);

      const activities = wcif.schedule.venues[0].rooms[0].activities;
      const replaceKeys = Object.keys(replaceDates);
      for (let i = 0; i < activities.length; i++) {
        for (let r = 0; r < replaceKeys.length; r++) {
          activities[i].startTime = activities[i].startTime.replace(replaceKeys[r], replaceDates[replaceKeys[r]]);
          activities[i].endTime = activities[i].endTime.replace(replaceKeys[r], replaceDates[replaceKeys[r]]);
          activities[i].childActivities = [];
          activities[i].extensions = [];
        }
      }

      this.patchWcif(wcif, competitionId, doneHandler, errorHandler);
    });
  }

  private copyEvents(wcif, wcifToCopy: any) {
    wcif.events = wcifToCopy.events;
  }

  private copyVenueAndRooms(wcif, wcifToCopy: any) {
    if (wcif.schedule.venues.length === 0) {
      wcif.schedule.venues = wcifToCopy.schedule.venues;
    } else if (wcif.schedule.venues[0].rooms?.length !== wcifToCopy.schedule.venues[0].rooms.length) {
      wcif.schedule.venues[0].rooms = [];
      for (const room of wcifToCopy.schedule.venues[0].rooms) {
        wcif.schedule.venues[0].rooms.push(room);
      }
    } else {
      for (const i = 0; i < wcif.schedule.venues[0].rooms.length; i++) {
        wcif.schedule.venues[0].rooms[i].activities = wcifToCopy.schedule.venues[0].rooms[i].activities;
      }
    }
  }

  private patchWcif(wcif, competitionId: string, doneHandler: () => void, errorHandler: (error) => void) {
    const wcifToSend = {
      id: wcif.id,
      events: wcif.events,
      schedule: wcif.schedule,
    };
    this.httpClient.patch(
      `${environment.wcaUrl}/api/v0/competitions/${competitionId}/wcif`,
      JSON.stringify(wcifToSend),
      {headers: this.headerParams})
      .subscribe(() => doneHandler(), (error) => {
        errorHandler(error?.error);
      });
  }

  private buildReplaceDates(wcifToCopy: any, wcif) {
    const replaceDates = {};
    let originalDate = wcifToCopy.schedule.startDate;
    let newDate = wcif.schedule.startDate;
    for (let i = 0; i < wcif.schedule.numberOfDays; i++) {
      replaceDates[originalDate] = newDate;
      originalDate = this.nextDay(originalDate);
      newDate = this.nextDay(newDate);
    }
    return replaceDates;
  }

  private nextDay(dateAsString: string) {
    const date = new Date(Date.parse(dateAsString));
    date.setDate(date.getDate() + 1);
    return this.format(date);
  }

  private format(date: Date): string {
    return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
  }

  logUserCopiedSchedule(from: string, to: string) {
    this.logMessage('Copied schedule from ' + from + ' to ' + to);
  }

  logError(error: string) {
    this.logMessage(error);
  }

  private logMessage(message: string) {
    if (!environment.testMode) {
      setTimeout(() => {
        try {
          this.logglyService.push(message);
        } catch (e) {
          console.error(e);
        }
      }, 0);
    }
  }

}
