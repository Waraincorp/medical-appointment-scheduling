/*
 * Angular 2 decorators and services
 */
import { Component, ViewEncapsulation }   from '@angular/core';
import { ViewContainerRef }               from '@angular/core';
import { OnInit }                         from '@angular/core';
import { Location }                       from '@angular/common';
import { MdSnackBar }                     from '@angular/material';
import { MdSnackBarRef }                  from '@angular/material';
import { SimpleSnackBar }                 from '@angular/material';
import { MdDialogRef, MdDialog,
 MdDialogConfig }                         from '@angular/material';
import { Router }                         from '@angular/router';

import { Subscription }                   from 'rxjs/Subscription';

import { AppState, Action }               from './app.service';
import { ExaminationService }             from './api/api/examination.service';
import { AttendanceService }              from './api/api/attendance.service';
import { AppointmentService }             from './api/api/appointment.service';
import { PatientService }                 from './api/api/patient.service';
import { RoomService }                    from './api/api/room.service';
import { CantyCTIService,
  IncomingCallState }                     from './cantyCti.service';

/*
 * App Component
 * Top Level Component
 */
@Component({
  selector: 'app',
  encapsulation: ViewEncapsulation.None,
  styleUrls: [ './app.component.scss' ],
  templateUrl: './app.component.html'
})

export class AppComponent implements OnInit {

  public url = 'https://twitter.com/AngularClass';
  public primaryAction: Action;
  public isSubPage = false;
  public title = 'Medical Appointment Scheduling';

  private actions: Action[];

  private snackBarRef: MdSnackBarRef<SimpleSnackBar>;

  constructor(
    private _state: AppState,
    private _location: Location,
    private router: Router,
    private attendanceService: AttendanceService,
    private appointmentService: AppointmentService,
    private examinationService: ExaminationService,
    private patientService: PatientService,
    private roomService: RoomService,
    private cantyCTIService: CantyCTIService,
    private snackBar: MdSnackBar,
    private viewContainerRef: ViewContainerRef) {}

  public ngOnInit() {
    this._state.ensureLocale(); // Make sure locale is set
    console.log('Locale is %s', localStorage.getItem('locale'));

    // Listen for title changes
    this._state.title.subscribe(
      (title) => this.title = title,
      (error) => {
        this.title = 'Medical Appointment Scheduling';
        console.log('Error getting title for activated route.');
      },
      () => console.log('Finished retrieving titles for activated route.')
    );

    // Listen for toolbar icon changes
    this._state.isSubPage.subscribe(
      (isSubPage) => this.isSubPage = isSubPage,
      (error) => {
        this.isSubPage = false;
        console.log('Error getting isSubPage for activated route.');
      },
      () => console.log('Finished retrieving isSubPage for activated route.')
    );

    // Listen for toolbar action changes
    this._state.actions.subscribe(
      (actions) => this.actions = actions,
      (error) => {
        this.actions = undefined;
        console.log('Error getting actions for activated route.');
      },
      () => console.log('Finished retrieving actions for activated route.')
    );

    // Listen for toolbar action changes
    this._state.primaryAction.subscribe(
      (primaryAction) => this.primaryAction = primaryAction,
      (error) => {
        this.primaryAction = undefined;
        console.log('Error getting primary action for activated route.');
      },
      () => console.log('Finished retrieving primary action for activated route.')
    );

    // Listen for CantyCTI events
    this.cantyCTIService.incomingCall.subscribe(
      (incomingCall) => {
        if (incomingCall.callState === IncomingCallState.RINGING) {
          const filter = {
            where: {
              phone: incomingCall.phoneNumber
            }
          };
          this.patientService.patientFindOne(JSON.stringify(filter))
          .subscribe(
            (patient) => {
              let message = localStorage.getItem('locale').startsWith('de') ?
                `Eingehender Anruf von ${patient.givenName} ${patient.surname}` :
                `Incoming call from ${patient.givenName} ${patient.surname}`;
              let action = localStorage.getItem('locale')
                .startsWith('de') ? 'Zum Patienten' : 'Open';

              this.snackBarRef = this.snackBar.open(message, action);

              this.snackBarRef.onAction().subscribe(
                null,
                null,
                () => this.router.navigate(['appointment', 'patient', patient.id])
              );
            },
            (err) => {
              this.snackBar.open(
                `Incoming call from ${incomingCall.phoneNumber}`,
                'OK'
              );
            }
          );
        } else if (incomingCall.callState === IncomingCallState.OFFHOOK) {
          // Nothing to do here, just keep displaying the snack bar
        } else { // Hang up, IDLE
          this.snackBarRef.dismiss(); // No probleme here if already dismissed
          this.snackBarRef = null;
        }
      },
      (err) => console.log(err),
      () => console.log('CantyCTI has finished broadcasting incoming calls.')
    );
  }

  public actionsHandler(action: Action) {
    if (action) {
      if (action.clickHandler) {
        action.clickHandler();
      }
    }
  }

  public navigateBack() {
    this._location.back();
  }

  public deleteAllRooms() {
    this.roomService.roomDeleteAllRooms()
    .subscribe(
      (x) => console.log(`Deleted all ${x.deletedCount} rooms.`),
      (err) => console.log(err)
    );
  }

  public deleteAllAppointments() {
    this.appointmentService.appointmentDeleteAllAppointments()
    .subscribe(
      (x) => console.log(`Deleted all ${x.deletedCount} appointments.`),
      (err) => console.log(err)
    );
  }

  public deleteAllExaminations() {
    this.examinationService.examinationDeleteAllExaminations()
    .subscribe(
      (x) => console.log(`Deleted all ${x.deletedCount} examinations.`),
      (err) => console.log(err)
    );
  }

  public deleteAllAttendances() {
    this.attendanceService.attendanceDeleteAllAttendances()
    .subscribe(
      (x) => console.log(`Deleted all ${x.deletedCount} attendances.`),
      (err) => console.log(err)
    );
  }

  public deleteAllPatients() {
    this.patientService.patientDeleteAllPatients()
    .subscribe(
      (x) => console.log(`Deleted all ${x.deletedCount} patients.`),
      (err) => console.log(err)
    );
  }

  public insertTestPatients() {
    this.patientService.patientInsertTestData(localStorage.getItem('locale'))
    .subscribe(
      (x) => console.log(`Inserted ${x.insertCount} test entries for patients.`),
      (err) => console.log(err)
    );
  }

  public insertTestExaminations() {
    this.examinationService.examinationInsertTestData(localStorage.getItem('locale'))
    .subscribe(
      (x) => console.log(`Inserted ${x.insertCount} test entries for examinations.`),
      (err) => console.log(err)
    );
  }

  public insertTestRooms() {
    this.roomService.roomInsertTestData(localStorage.getItem('locale'))
    .subscribe(
      (x) => console.log(`Inserted ${x.insertCount} test entries for rooms.`),
      (err) => console.log(err)
    );
  }

  public createRandomAppointments() {
    this.appointmentService.appointmentGenerateRandomAppointments()
    .subscribe(
      (x) => console.log(`Created random appointments.`),
      (err) => console.log(err)
    );
  }

  public createRandomAttendances() {
    this.attendanceService.attendanceGenerateRandomAttendances()
    .subscribe(
      (x) => console.log(`Created random attendances.`),
      (err) => console.log(err)
    );
  }
}
