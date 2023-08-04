import {Component, ViewChild, AfterViewInit} from '@angular/core';
import {DayPilot, DayPilotQueueComponent, DayPilotSchedulerComponent} from 'daypilot-pro-angular';
import {DataService} from './data.service';

@Component({
  selector: 'scheduler-component',
  template: `
    <div class="parent">
      <div class="left">
        <button (click)="addTask()">Add</button>
        <daypilot-queue [config]="queueConfig" #queue></daypilot-queue>
      </div>
      <div class="right">
        <daypilot-scheduler [config]="schedulerConfig" #scheduler></daypilot-scheduler>
      </div>
    </div>
  `,
  styles: [`
    .parent {
      display: flex;
    }
    .left {
      margin-right: 10px;
      width: 200px;
    }
    .right {
      flex-grow: 1;
    }
    button {
      background-color: #f3f3f3;
      border: 1px solid #c0c0c0;
      color: #333;
      padding: 8px 0px;
      width: 100%;
      border-radius: 2px;
      cursor: pointer;
      margin-right: 5px;
      margin-bottom: 5px;
    }
  `]
})
export class SchedulerComponent implements AfterViewInit {

  @ViewChild('scheduler')
  scheduler!: DayPilotSchedulerComponent;

  @ViewChild('queue')
  queue!: DayPilotQueueComponent;

  queueConfig: DayPilot.QueueConfig = {
    emptyText: "No tasks",
    eventBarVisible: false,
    eventHeight: 40,
    contextMenu: new DayPilot.Menu({
      items: [
        {
          text: "Delete",
          onClick: (args) => {
            this.queue.control.events.remove(args.source);
          }
        }
      ]
    }),
    onEventMove: (args) => {
      if (args.external) {
        this.scheduler.control.events.remove(args.e.data.id);
      }
      else {
        console.log("target position", args.position);
      }
    },
    onBeforeEventRender: (args) => {
      args.data.areas = [
        {
          top: 5,
          right: 5,
          width: 30,
          height: 30,
          style: "border-radius: 50%; padding: 4px; box-sizing: border-box; cursor: pointer;",
          fontColor: "#fff",
          backColor: DayPilot.ColorUtil.darker("#6aa84f", 2),
          symbol: "assets/daypilot.svg#minichevron-down-2",
          action: "ContextMenu",
        }
      ]
    }
  };

  schedulerConfig: DayPilot.SchedulerConfig = {
    timeHeaders: [{groupBy:"Day", format: "dddd MMMM d, yyyy"},{groupBy:"Hour"}],
    scale: "Hour",
    days: DayPilot.Date.today().daysInMonth(),
    startDate: DayPilot.Date.today().firstDayOfMonth(),
    cellWidth: 80,
    dragOutAllowed: true,
    timeRangeSelectedHandling: "Enabled",
    durationBarVisible: false,
    eventHeight: 40,
    eventMarginBottom: 5,
    rowMarginTop: 5,
    rowMinHeight: 50,
    treeEnabled: true,
    contextMenu: new DayPilot.Menu({
      items: [
        {
          text: "Delete",
          onClick: (args) => {
            this.scheduler.control.events.remove(args.source);
          }
        }
      ]
    }),
    onTimeRangeSelected: async (args) => {
      const dp = args.control;
      const modal = await DayPilot.Modal.prompt("Create a new event:", "Event 1");
      dp.clearSelection();
      if (modal.canceled) { return; }
      dp.events.add({
        start: args.start,
        end: args.end,
        id: DayPilot.guid(),
        resource: args.resource,
        text: modal.result
      });
    },
    onEventMove: (args) => {
      if (args.external) {
        args.control.message("Moved from queue");
        this.queue.control.events.remove(args.e.data.id);
      }
    },
    onBeforeEventRender: (args) => {
      args.data.fontColor = "#fff";
      args.data.areas = [
        {
          top: 5,
          right: 5,
          width: 30,
          height: 30,
          style: "border-radius: 50%; padding: 4px; box-sizing: border-box; cursor: pointer;",
          fontColor: "#fff",
          backColor: DayPilot.ColorUtil.darker("#6aa84f", 2),
          symbol: "assets/daypilot.svg#minichevron-down-2",
          action: "ContextMenu",
        }
      ]
    }
  };

  constructor(private ds: DataService) {
  }

  ngAfterViewInit(): void {
    this.ds.getResources().subscribe(result => this.schedulerConfig.resources = result);

    const from = this.scheduler.control.visibleStart();
    const to = this.scheduler.control.visibleEnd();
    this.ds.getEvents(from, to).subscribe(events => {
      this.scheduler.control.update({events});
      this.scheduler.control.scrollTo(DayPilot.Date.today());
    });

    this.ds.getQueue().subscribe(events => {
      this.queue.control.update({events});
    });
  }

  async addTask(): Promise<void> {

    const durations = [
      {name: "1 hour", id: "60"},
      {name: "2 hours", id: "120"},
      {name: "3 hours", id: "180"},
      {name: "4 hours", id: "240"},
    ];

    const form = [
      {name: "Name", id: "text"},
      {name: "Duration", id: "minutes", type: "select", options: durations}
    ];
    const data= {
      text: "Task 1",
      minutes: 60
    };
    const modal = await DayPilot.Modal.form(form, data);

    if (modal.canceled) {
      return;
    }

    const e = modal.result;
    e.id = DayPilot.guid();
    e.duration = DayPilot.Duration.ofMinutes(e.minutes);

    this.queue.control.events.add(e);
  }

}

