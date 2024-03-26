import { environment } from '../environments/environment';
import { Component } from '@angular/core';
import { ApiService } from '../common/api';
declare var $: any;

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent  {
  // Info about competitions managed by user
  competitionsToChooseFrom: Array<any> = null;
  competitionId: string;
  numberOfEvents: number;
  numberOfVenues: number;
  wcif: any; // wcif to copy from
  state: 'COPY_FROM' | 'COPY_TO';
  showPatching = false;
  showDone = false;
  error;

  constructor (
    public apiService: ApiService
    ) {
      this.state =  'COPY_FROM';
      if (this.apiService.oauthToken) {
        this.handleGetCompetitions();
      }
  }

  handleLoginToWca() {
    this.apiService.logIn();
  }

  handleGetCompetitions() {
    this.apiService.getCompetitions().subscribe(competitions => {
      this.competitionsToChooseFrom = competitions;
      this.competitionsToChooseFrom
        .forEach((competition) => competition.days = this.getDays(competition));
    });
  }

  private getDays(competition) {
    return Math.round((Date.parse(competition.end_date) - Date.parse(competition.start_date))
      / (24 * 60 * 60 * 1000)) + 1;
  }

  handleCompetitionSelected(competitionId: string) {
    this.competitionId = competitionId;
    this.wcif = null;
    this.apiService.getWcif(this.competitionId).subscribe(wcif => {
      this.wcif = wcif;
      this.numberOfEvents = wcif?.events?.length;
      this.numberOfVenues = wcif.schedule?.venues?.length;
    }, (error) => {
      this.error = error;
      this.apiService.logError(error?.status + ' - ' + error?.error + ' - while fetching ' + competitionId);
    });
  }

  handleGoToSelectToCopyTo() {
    this.state = 'COPY_TO';
  }

  handleCopyTo(competitionId: string) {
    this.showPatching = true;
    // TODO shiftMinutes from user input?
    this.apiService.submitEventsAndSchedule(competitionId, this.wcif, 0, () => {
      this.showPatching = false;
      this.showDone = true;
      this.apiService.logUserCopiedSchedule(this.wcif.id, competitionId);
      return;
    }, (error) => {
      this.showPatching = false;
      this.error = error;
      this.apiService.logError(error?.status + ' - ' + error?.error + ' - while copying from ' + this.wcif.id + ' to ' + competitionId);
    });
  }

  version() {
    return environment.version;
  }

}
