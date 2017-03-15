import { Component, OnInit }      from '@angular/core';
import { NgForm }                 from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import * as moment                from 'moment';

import { AppState }               from '../app.service';
import { CantyCTIService }        from '../cantyCti.service';
import { Appointment }            from '../api/model/appointment';
import { Attendance }             from '../api/model/attendance';
import { AppointmentService }     from '../api/api/appointment.service';
import { Examination }            from '../api/model/examination';
import { Patient }                from '../api/model/patient';
import { Room }                   from '../api/model/room';

@Component({
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss' ]
})

export class AppointmentAttendanceComponent implements OnInit {

  public appointmentsScheduled: Appointment[] = [];
  public appointmentsCheckedIn: Appointment[] = [];
  public appointmentsUnderTreatment: Appointment[] = [];
  public appointmentsFinished: Appointment[] = [];

  private allAppointments: any[] = []; // TODO Fix any ViewAppointment

  constructor(
    private _state: AppState,
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: AppointmentService,
    private cantyCTIService: CantyCTIService) {}

  public ngOnInit(): void {
    // Mouseflow integration
    if ((<any> window)._mfq) {
      (<any> window)._mfq.push(['newPageView', '/appointment/attendance']);
    }

    // Set up page
    this._state.isSubPage.next(false);
    this._state.title.next(
      localStorage.getItem('locale').startsWith('de') ? 'Anwesenheit' : 'Attendance List');
    this._state.actions.next();
    this._state.primaryAction.next({
      icon: 'person_add',
      routerLink: 'appointment/walk-in-check-in'
    });

    // Retrieve data
    this.getTodaysAppointments();
  }

  /**
   * Checks in a patient.
   * Moves the patient from the list of scheduled patients to the list of checked in
   * (present) patients.
   */
  public checkIn(appointment: any): void { // TODO Fix any ViewAppointment
    // Prepare data
    let data: Attendance = {
      checkedIn: new Date()
    };

    // TODO check if this patient is already checked in, and allow/deny
    // this operation. Maybe we want to allow this, but in that case, we
    // would have to set checkedIn = underTreatment = new Date().

    this.appointmentService
    .appointmentPrototypeCreateAttendance(appointment.id.toString(), data)
    .subscribe(
      (x) => appointment.attendance = x,
      (e) => console.log(e),
      () => {
        console.log('Written attendance successfully.');
        let index = this.appointmentsScheduled.indexOf(appointment);
        if (index > -1) {
          this.appointmentsScheduled.splice(index, 1);
        }
        this.appointmentsCheckedIn.push(appointment);
      }
    );
  }

  /**
   * Marks a patient as under treatment.
   * Moves the patient from the list of checked in (present) patients to the list of
   * patients currently under treatment.
   */
  public underTreatment(appointment: any): void { // TODO Fix any ViewAppointment
    // Prepare data
    let data: Attendance = {
      underTreatment: new Date()
    };

    // TODO check if this patient is already checked in, and allow/deny
    // this operation. Maybe we want to allow this, but in that case, we
    // would have to set checkedIn = underTreatment = new Date().

    this.appointmentService
    .appointmentPrototypeUpdateAttendance(appointment.id.toString(), data)
    .subscribe(
      (x) => appointment.attendance = x,
      (e) => console.log(e),
      () => {
        console.log('Updated attendance successfully.');
        let index = this.appointmentsCheckedIn.indexOf(appointment);
        if (index > -1) {
          this.appointmentsCheckedIn.splice(index, 1);
        }
        this.appointmentsUnderTreatment.push(appointment);
      }
    );
  }

  /**
   * Checks a patient out.
   * Moves the patient from the list of patients currently under treatment to the list
   * of patients that are finished.
   */
  public checkOut(appointment: any): void { // TODO Fix any ViewAppointment
    // Prepare data
    let data: Attendance = {
      finished: new Date()
    };

    // TODO check if this patient is already checked in, and allow/deny
    // this operation. Maybe we want to allow this, but in that case, we
    // would have to set checkedIn = underTreatment = new Date().

    this.appointmentService
    .appointmentPrototypeUpdateAttendance(appointment.id.toString(), data)
    .subscribe(
      (x) => appointment.attendance = x,
      (e) => console.log(e),
      () => {
        console.log('Updated attendance successfully.');
        let index = this.appointmentsUnderTreatment.indexOf(appointment);
        if (index > -1) {
          this.appointmentsUnderTreatment.splice(index, 1);
        }
        this.appointmentsFinished.push(appointment);
      }
    );
  }

  /**
   * Requests a call to the supplied phone number using a CTI service.
   */
  public requestCall(phoneNumber: String) {
    this.cantyCTIService.requestCall(phoneNumber);
  }

  private getTodaysAppointments(): void {
    let start = moment.utc().startOf('day');
    let end = moment.utc().endOf('day');
    this.appointmentService
    .appointmentFind(
      `{"where": {"start":  {"between": ["${start.format()}", "${end.format()}"]}}}`
    )
    .subscribe(
      (x) => {
        this.allAppointments = x;
        for (let appointment of this.allAppointments) {

          // Check if an attendance exists for this appointment
          this.appointmentService
          .appointmentPrototypeGetAttendance(appointment.id.toString())
          .subscribe(
            (attendance) => {
              // Store attendance with appointment for later use
              appointment.attendance = attendance;

              // Patient has already attended. Check state:
              if (attendance.finished) {
                this.appointmentsFinished.push(appointment);
              } else if (attendance.underTreatment) {
                this.appointmentsUnderTreatment.push(appointment);
              } else if (attendance.checkedIn) {
                this.appointmentsCheckedIn.push(appointment);
              }
            },
            (e) => {
              if (e._body.error.statusCode === 404 && e._body.error.code === 'MODEL_NOT_FOUND') {
                this.appointmentsScheduled.push(appointment);
                console.log('No attendance yet for this appointment.');
              } else {
                console.log(e);
              }
            },
            () => console.log('Get attendance completed.')
          );

          // Resolve patient name
          this.appointmentService
          .appointmentPrototypeGetPatient(appointment.id.toString())
          .subscribe(
            (patient) => appointment.patient = patient,
            (e) => console.log(e),
            () => console.log('Get patient completed.')
          );

          // Resolve examinations
          this.appointmentService
          .appointmentPrototypeGetExaminations(appointment.id.toString())
          .subscribe(
            (examinations) => appointment.examinations = examinations,
            (e) => console.log(e),
            () => console.log('Get examinations completed.')
          );

        }
      },
      (e) => console.log(e),
      () => console.log('Get today\'s appointments completed.')
    );
  }
}