import { Component } from '@angular/core';
import { ApiService } from '../common/api';
declare var $ :any;

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
  wcif: any; // wcif to copy from
  state: 'COPY_FROM' | 'COPY_TO';
  
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
          /(24*60*60*1000));
      });
    });
  }

  handleCompetitionSelected(competitionId: string) {
    this.competitionId = competitionId;
    this.apiService.getWcif(this.competitionId).subscribe(wcif => {
      this.wcif = wcif;
      this.numberOfEvents = (wcif && wcif.events) ? wcif.events.length : 0;
    });
  }
  
  handleGoToSelectToCopyTo() {
    this.state = 'COPY_TO';
  }
  
  handleCopyTo(competitionId: string) {
    this.apiService.submitEventsAndSchedule(competitionId, this.wcif);
  }

}
