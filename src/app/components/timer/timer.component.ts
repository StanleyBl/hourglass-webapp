import { Component, OnInit } from '@angular/core';
import { TimeBookings, TimeTracker, TimeTrackers } from '../../services/timer/timer.interface';
import { TimerService } from '../../services/timer/timer.service';
import { UserService } from '../../services/user/user.service';
import { RedmineService } from '../../services/redmine/redmine.service';
import { TimerStore } from '../../services/stores/timer-store.service';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss']
})
export class TimerComponent implements OnInit {

  currentTimeTracker: Partial<TimeTracker> = {};
  isLoading: boolean;
  isRunning: boolean;

  userId: number;

  timeLogs: TimeTrackers;
  timeBookings: TimeBookings;
  isAutomaticMode = true;

  constructor(private timerService: TimerService,
              private userService: UserService,
              private timerStore: TimerStore,
              public snackBar: MatSnackBar) { }

  ngOnInit() {
    this.userId = this.userService.getUserId();
    this.getCurrentTimer();
    this.timerStore.loadData();
    this.timerStore.timeBookings$.subscribe(bookings => { this.timeBookings = bookings; });
    this.timerStore.timeTrackers$.subscribe(trackers => { this.timeLogs = trackers; });
    this.timerStore.isLoading$.subscribe(loading => { this.isLoading = loading; });
  }

  startTimer(timeTracker: Partial<TimeTracker>) {
    this.isLoading = true;
    this.timerService.startTimeTracker(timeTracker).subscribe(result => {
      this.currentTimeTracker = result;
      this.isRunning = true;
      this.isLoading = false;
    }, error => {
      this.snackBar.open(error.message, '', {duration: 4000});
      console.log(error);
      this.isLoading = false;
    });
  }

  stopTimer(timerId: number) {
    this.isLoading = true;
    this.timerService.stopTimeTracker(timerId).subscribe(result => {
      this.isRunning = false;
      this.isLoading = false;
      this.timerStore.loadData();
    }, error => {
      this.snackBar.open(error.message, '', {duration: 4000});
      this.isLoading = false;
      console.log(error);
    });
  }

  getCurrentTimer() {
    this.timerService.getCurrentTimeTrackers().subscribe(currentTimeTrackers => {
      if (currentTimeTrackers.count !== 0) {
        const records = currentTimeTrackers.records;
        const currentUserRecord = records.find(record => record.user_id === this.userId);
        if (currentUserRecord) {
          this.currentTimeTracker = currentUserRecord;
          this.isRunning = true;
        }
      }
    }, error => {
      console.log(error);
    });
  }

  getTimlogDeleteEvent(timeLogId: number) {
    this.timerService.deleteTimeLog(timeLogId).subscribe(result => {
      this.snackBar.open('time entry deleted', '', {duration: 4000});
    }, error => {
      this.snackBar.open(error.message, '', {duration: 4000});
      console.log(error);
    });
  }

  getAddManualTimeEntryEvent(newTimeLogs: Partial<TimeTracker>[]) {
    this.timerService.createTimeLogs(newTimeLogs).subscribe(result => {
      if (result) {
        this.bookManualTimeEntry(result.success[0].id, newTimeLogs[0]);
      }
    }, error => {
      console.log(error);
    });
  }

  bookManualTimeEntry(id: number, timeLog: Partial<TimeTracker>) {
    this.timerService.bookTimeLog(id, timeLog).subscribe(result => {

      this.timerStore.loadData();
    }, error => {
      console.log(error);
    });
  }


}
