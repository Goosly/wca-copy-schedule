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
  competitionsToChooseFrom: Array<String> = null;
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
      this.competitionsToChooseFrom = comps.map(c => c['id']);
    });
  }

  handleCompetitionSelected(competitionId: string) {
    this.competitionId = competitionId;
    this.apiService.getWcif(this.competitionId).subscribe(wcif => {
      this.wcif = wcif;
      this.resetWcif();
      this.numberOfEvents = (wcif && wcif.events) ? wcif.events.length : 0;
    });
  }
  
  private resetWcif() {
    this.wcif.extensions = undefined;
    this.wcif.id = undefined;
    this.wcif.name = undefined;
    this.wcif.persons = undefined;
    this.wcif.shortName = undefined;
    this.wcif.schedule = undefined; // todo
  }
  
  handleGoToSelectToCopyTo() {
    this.state = 'COPY_TO';
  }
  
  handleCopyTo(competitionId: string) {
    this.wcif.id = competitionId;
    this.apiService.submitEventsAndSchedule(this.wcif);
  }

}
