import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ComponentTestPageComponent } from './component/component-test-page/component-test-page.component';
import { JyucyuIkkatsuComponent } from './jyucyu/jyucyu-ikkatsu/jyucyu-ikkatsu.component';
import { JyucyuListComponent } from './jyucyu/jyucyu-list/jyucyu-list.component';
import { JyucyuViewToolPanelComponent } from './jyucyu/jyucyu-list/jyucyu-view-tool-panel.component';
import { JyucyuRegisterComponent } from './jyucyu/jyucyu-register/jyucyu-register.component';
import { NvsInputDateComponent } from './shared/nvs-input-date/nvs-input-date.component';
import { TorihikisakiLinkCellRendererComponent } from './shared/torihikisaki-link-cell-renderer/torihikisaki-link-cell-renderer.component';
import { TorihikisakiPopupComponent } from './shared/torihikisaki-popup/torihikisaki-popup.component';

@NgModule({
  declarations: [
    AppComponent,
    ComponentTestPageComponent,
    JyucyuListComponent,
    JyucyuViewToolPanelComponent,
    JyucyuRegisterComponent,
    JyucyuIkkatsuComponent,
    NvsInputDateComponent,
    TorihikisakiLinkCellRendererComponent,
    TorihikisakiPopupComponent
  ],
  imports: [BrowserModule, FormsModule, ReactiveFormsModule, AppRoutingModule, AgGridModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}

