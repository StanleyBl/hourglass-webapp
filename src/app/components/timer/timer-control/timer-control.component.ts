import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { interval, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TimeTracker } from '../../../services/timer/timer.interface';
import { Project } from '../../../services/redmine/redmine.interface';
import { TimerStore } from '../../../services/stores/timer-store.service';

@Component({
  selector: 'app-timer-control',
  templateUrl: './timer-control.component.html',
  styleUrls: ['./timer-control.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TimerControlComponent implements OnInit {

  @Input() timeTracker: Partial<TimeTracker> = {};
  @Input() isLoading: boolean;
  @Input() isRunning: boolean;

  @Output() startTimerEvent: EventEmitter<Partial<TimeTracker>> = new EventEmitter<Partial<TimeTracker>>();
  @Output() stopTimerEvent: EventEmitter<number> = new EventEmitter<number>();

  projects: Project[];
  currentTime$: Observable<number>;
  timeLogs: TimeTracker[];
  selectedTimeLogs: TimeTracker[];

  constructor(private dataStore: TimerStore) { }

  ngOnInit() {
    this.dataStore.projects$.subscribe(data => this.projects = data);
    this.dataStore.timeTrackers$.subscribe(timelogs => this.timeLogs = timelogs.records);
    this.currentTime$ = interval(1000).pipe(
      map((x) => {
        if (this.isRunning) {
          return this.getTimeDifference(this.timeTracker.created_at);
        }
      })
    );
  }

  getTimeDifference(startTime: string): number {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const diff = now - start;
    const result = new Date(diff);
    result.setHours(result.getUTCHours());
    result.setMinutes(result.getUTCMinutes());
    result.setSeconds(result.getSeconds());
    return result.getTime();
  }

  start() {
    this.startTimerEvent.emit(this.timeTracker);
  }

  stop() {
    this.stopTimerEvent.emit(this.timeTracker.id);
    this.timeTracker = {};
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

      this.selectedTimeLogs.splice(10, this.selectedTimeLogs.length);
    } else {
      this.selectedTimeLogs = [];
    }
  }

  onSelectTimelog(timelog: TimeTracker) {
    this.timeTracker.project_id = timelog.project.id;
  }
}
