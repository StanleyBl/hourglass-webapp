import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { Project } from '../../../services/redmine/redmine.interface';
import { TimeTracker, TimeEntry } from '../../../services/timer/timer.interface';
import { TimerService } from '../../../services/timer/timer.service';
import { RedmineService } from '../../../services/redmine/redmine.service';
import { TimerStore } from '../../../services/stores/timer-store.service';

@Component({
  selector: 'app-timer-control-manual',
  templateUrl: './timer-control-manual.component.html',
  styleUrls: ['./timer-control-manual.component.scss']
})
export class TimerControlManualComponent implements OnInit {

  @Input() timeTracker: Partial<TimeTracker> = {};
  @Input() isLoading = false;
  @Input() userId: number;
  @Output() addManualTimeEntryEvent: EventEmitter<Partial<TimeTracker>[]> = new EventEmitter<Partial<TimeTracker>[]>();

  projects: Project[];
  model: TimeEntry;

  timeLogs: TimeTracker[];
  selectedTimeLogs: TimeTracker[];

  inputDate: Date;
  inputStart: string;
  inputEnd: string;

  constructor(private dataService: RedmineService,
    private dataStore: TimerStore) { }

  ngOnInit() {
    this.dataStore.projects$.subscribe(data => this.projects = data);
    this.dataStore.timeTrackers$.subscribe(logs => this.timeLogs = logs.records);
    this.model = new TimeEntry();
    this.inputDate = new Date();
    this.inputStart = this.inputDate.getHours().toString().padStart(2, '0') +
        ':' + this.inputDate.getMinutes().toString().padStart(2, '0');
    this.inputEnd = this.inputDate.getHours().toString().padStart(2, '0') +
        ':' + (this.inputDate.getMinutes() + 1).toString().padStart(2, '0');
    this.timeTracker.billable = true;
  }

  add() {
    const startTime = this.inputStart.split(':');
    const endTime = this.inputEnd.split(':');
    const start = new Date(this.inputDate).setHours(+startTime[0], +startTime[1], 0, 0);
    const stop = new Date(this.inputDate).setHours(+endTime[0], +endTime[1], 0, 0);

    const newTimelog: Partial<TimeTracker>[] = [{
      start: new Date(start).toISOString(),
      stop: new Date(stop).toISOString(),
      user_id: this.userId,
      project_id: this.timeTracker.project_id ? this.timeTracker.project_id : null,
      issue_id: this.timeTracker.issue_id ? this.timeTracker.issue_id : null,
      comments: this.timeTracker.comments ? this.timeTracker.comments : null,
      activity_id: this.timeTracker.billable ? 13 : 14
    }];

    this.addManualTimeEntryEvent.emit(newTimelog);
    this.timeTracker = {};
    this.ngOnInit();

  }

  onAutoSelectLogs($event) {
    const searchString = String($event.srcElement.value).toLowerCase();
    if (searchString.length > 0) {
      this.selectedTimeLogs = this.timeLogs.filter(x => x.comments.toLowerCase().includes(searchString));
      this.selectedTimeLogs.sort((a, b) => b.id - a.id);

      // remove dublicates
      this.selectedTimeLogs = this.selectedTimeLogs.filter((thing, index, self) =>
        index === self.findIndex((t) => (
          t.comments === thing.comments
        ))
      );
      // show max 10 entries
      this.selectedTimeLogs.splice(10, this.selectedTimeLogs.length);
    } else {
      this.selectedTimeLogs = [];
    }
  }

  onSelectTimelog(timelog: TimeTracker) {
    if (timelog.project) {
      this.timeTracker.project_id = timelog.project.id;
    }
  }
}
