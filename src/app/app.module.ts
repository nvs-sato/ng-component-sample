import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AgGridModule } from 'ag-grid-angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { JyucyuListComponent } from './jyucyu/jyucyu-list/jyucyu-list.component';

@NgModule({
  declarations: [AppComponent, JyucyuListComponent],
  imports: [BrowserModule, AppRoutingModule, AgGridModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
