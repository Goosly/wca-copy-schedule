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
    this.apiService.getCompetitions().subscribe(comps => {
      this.competitionsToChooseFrom = comps;
      this.competitionsToChooseFrom.forEach(function(c) {
        c.days = 1 + Math.round((Date.parse(c.end_date) - Date.parse(c.start_date))
          / (24 * 60 * 60 * 1000));
      });
    });
  }

  handleCompetitionSelected(competitionId: string) {
    this.competitionId = competitionId;
    this.wcif = null;
    this.apiService.getWcif(this.competitionId).subscribe(wcif => {
      this.wcif = wcif;
      this.numberOfEvents = wcif?.events?.length;
      this.numberOfVenues = wcif.schedule?.venues?.length;
    });
  }

  handleGoToSelectToCopyTo() {
    this.state = 'COPY_TO';
  }

  handleCopyTo(competitionId: string) {
    this.showPatching = true;
    this.apiService.submitEventsAndSchedule(competitionId, this.wcif, () => {
      this.showPatching = false;
      this.showDone = true;
      this.apiService.logUserCopiedSchedule(this.wcif.id, competitionId);
      return;
    }, (error) => {
      this.showPatching = false;
      this.error = error;
      this.apiService.logError(error?.status + ' - ' + error?.error);
      return;
    });
  }

  version() {
    return environment.version;
  }

}
