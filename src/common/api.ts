import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  public oauthToken;
  private headerParams: HttpHeaders;

  constructor(private httpClient: HttpClient) {
    this.getToken();

    this.headerParams = new HttpHeaders();
    this.headerParams = this.headerParams.set('Authorization', `Bearer ${this.oauthToken}`);
    this.headerParams = this.headerParams.set('Content-Type', 'application/json');
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
    url += `&start=${new Date().toISOString()}&sort=start_date&per_page=1000`;
    return this.httpClient.get(url, {headers: this.headerParams});
  }

  getWcif(competitionId): Observable<any> {
    return this.httpClient.get(`${environment.wcaUrl}/api/v0/competitions/${competitionId}/wcif`,
      {headers: this.headerParams});
  }

  submitEventsAndSchedule(competitionId: string, wcifToCopy: any, doneHandler: () => void, errorHandler: (error) => void): void {
    this.getWcif(competitionId).subscribe(wcif => {
      wcif.events = wcifToCopy.events;

      if (wcif.schedule.venues.length === 0) {
        wcif.schedule.venues = wcifToCopy.schedule.venues;
      } else {
        wcif.schedule.venues[0].rooms = [];
        wcif.schedule.venues[0].rooms.push(wcifToCopy.schedule.venues[0].rooms[0]);
      }

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
    let d1 = wcifToCopy.schedule.startDate;
    let d2 = wcif.schedule.startDate;
    for (let i = 0; i < wcif.schedule.numberOfDays; i++) {
      replaceDates[d1] = d2;
      d1 = this.nextDay(d1);
      d2 = this.nextDay(d2);
    }
    return replaceDates;
  }

  private nextDay(date: string) {
    const d = new Date(Date.parse(date));
    d.setDate(d.getDate() + 1);
    return this.format(d);
  }

  private format(date: Date): string {
    return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
  }

}
