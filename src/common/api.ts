import {Injectable, isDevMode} from '@angular/core';
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
  
  test(): void {
    this.httpClient.patch(
      //'https://cors-anywhere.herokuapp.com/' +
        `${environment.wcaUrl}/api/v0/competitions/TEMPcomp2019/wcif`,
      //JSON.stringify(
        '{formatVersion:"1.0",events:[{"id":"333","rounds":[{"id":"333-r1","format":"a","timeLimit":{"centiseconds":30000,"cumulativeRoundIds":[]},"cutoff":null,"advancementCondition":null,"scrambleSetCount":1,"results":[],"extensions":[]},{"id":"333-r2","format":"a","timeLimit":{"centiseconds":20000,"cumulativeRoundIds":[]},"cutoff":null,"advancementCondition":null,"scrambleSetCount":1,"results":[],"extensions":[]},{"id":"333-r3","format":"a","timeLimit":{"centiseconds":20000,"cumulativeRoundIds":[]},"cutoff":null,"advancementCondition":null,"scrambleSetCount":1,"results":[],"extensions":[]}],"extensions":[]}]}'
      
      //)
      ,
      {headers: this.headerParams})
        .subscribe();
  }
  
  getMe(): void {
    this.httpClient.get(`${environment.wcaUrl}/api/v0/me`, {headers: this.headerParams}).subscribe();
  }

  getCompetitions(): Observable<any> {
    let url: string = `${environment.wcaUrl}/api/v0/competitions?managed_by_me=true`;
    return this.httpClient.get(url, {headers: this.headerParams});
  }

  getWcif(competitionId): Observable<any> {
    return this.httpClient.get(`${environment.wcaUrl}/api/v0/competitions/${competitionId}/wcif`,
      {headers: this.headerParams});
  }
  
  submitEventsAndSchedule(wcif: any): void {
    this.httpClient.patch('https://cors-anywhere.herokuapp.com/' +
        `${environment.wcaUrl}/api/v0/competitions/${wcif.id}/wcif`,
      JSON.stringify(wcif),
      {headers: this.headerParams})
        .subscribe();
  }

}
