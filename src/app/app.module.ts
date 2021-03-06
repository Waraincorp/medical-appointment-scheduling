import { NgModule }                     from '@angular/core';
import { BrowserModule }                from '@angular/platform-browser';
import { FormsModule }                  from '@angular/forms';
import { HttpModule }                   from '@angular/http';
import { MaterialModule }               from '@angular/material';

import { Md2Module }                    from 'md2';

import { BASE_PATH }                    from './api/variables';
import { CANTY_CTI_HOST }               from './cantyCti.service';

import { AppComponent }                 from './app.component';
import { AppState }                     from './app.service';
import { AppRoutingModule }             from './app-routing.module';
import { CantyCTIService }              from './cantyCti.service';

import { AppointmentModule }            from './appointment/appointment.module';
import { HomeModule }                   from './home/home.module';
import { AboutComponent }               from './about/about.component';
import { NoContentComponent }           from './no-content/no-content.component';
import { XLargeDirective }              from './home/x-large/x-large.directive';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppointmentModule,
    HomeModule,
    MaterialModule.forRoot(),
    Md2Module.forRoot(),
    AppRoutingModule
  ],
  declarations: [
    AppComponent,
    AboutComponent,
    NoContentComponent,
    XLargeDirective
  ],
  providers: [
    AppState,
    CantyCTIService,
    {
      provide: BASE_PATH, // Used in apis as base path.
      useValue: API_BASE_PATH // Declared in custom-typings.d.ts, set by webpack's DefinePlugin
    },
    {
      provide: CANTY_CTI_HOST,
      useValue: CANTY_HOST_URL // Declared in custom-typings.d.ts, set by webpack's DefinePlugin
    }
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}
