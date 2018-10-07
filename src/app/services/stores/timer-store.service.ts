import { Injectable } from '@angular/core';
import { Subject, Observable, forkJoin } from 'rxjs';
import { TimeTrackers, TimeBookings } from '../timer/timer.interface';
import { TimerService } from '../timer/timer.service';
import { Project, Projects } from '../redmine/redmine.interface';
import { RedmineService } from '../redmine/redmine.service';

@Injectable({
  providedIn: 'root'
})
export class TimerStore {

  colorCodes = [
    { code: '4' , value: '0123456789'},
    { code: '5' , value: 'abc'},
    { code: '6' , value: 'def'},
    { code: '7' , value: 'ghi'},
    { code: '8' , value: 'jkl'},
    { code: '9' , value: 'mno'},
    { code: 'A' , value: 'pqr'},
    { code: 'B' , value: 'stu'},
    { code: 'C' , value: 'vwx'},
    { code: 'D' , value: 'yz'},
  ];

  public isLoading$:  Subject<boolean> = new Subject<boolean>();
  public timeTrackers$: Subject<TimeTrackers> = new Subject<TimeTrackers>();
  public timeBookings$: Subject<TimeBookings> = new Subject<TimeBookings>();
  public projects$: Subject<Project[]> = new Subject<Project[]>();

  timeLogs: TimeTrackers;
  timeBookings: TimeBookings;
  projects: Projects;

  constructor(private dataService: TimerService,
    private redmineService: RedmineService) { }

  loadData() {
    this.isLoading$.next(true);
    const calls: Observable<any>[] = [];

    calls.push(this.dataService.getTimeLogs());
    calls.push(this.dataService.getTimeBookings());
    calls.push(this.redmineService.getProjects());

    forkJoin(calls).subscribe((data) => {
      this.timeLogs = data[0];
      this.timeBookings = data[1];
      this.projects = data[2];

      this.projects.projects.forEach(x => x.color = this.getRandomColor(x.name));
      this.assignProject();

      this.timeTrackers$.next(data[0]);
      this.timeBookings$.next(data[1]);
      this.projects$.next(this.projects.projects);
      this.isLoading$.next(false);
    }, error => {
      console.log(error);
      this.isLoading$.next(false);
    });
  }


  private assignProject() {
    for (const item of this.timeLogs.records) {
      const booking = this.timeBookings.records.find(x => x.time_log_id === item.id);
      if (booking) {
        item.project = this.projects.projects.find(x => x.id === booking.time_entry.project_id);
      }
    }
  }

  private getRandomColor(projectName: string) {
    const chars = projectName
      .replace(/[^a-z0-9]/gi, '')
      .slice(-6)
      .padStart(6, '000')
      .split('');

    let colorCode = '#';
    for (const item of chars) {
      colorCode += this.colorCodes.find(x => x.value.includes(item.toLowerCase())).code;
    }
    return colorCode;
  }
}
