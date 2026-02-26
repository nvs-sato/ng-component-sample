import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { JyucyuIkkatsuComponent } from './jyucyu/jyucyu-ikkatsu/jyucyu-ikkatsu.component';
import { JyucyuListComponent } from './jyucyu/jyucyu-list/jyucyu-list.component';
import { JyucyuRegisterComponent } from './jyucyu/jyucyu-register/jyucyu-register.component';
import { TorihikisakiLinkCellRendererComponent } from './shared/torihikisaki-link-cell-renderer/torihikisaki-link-cell-renderer.component';
import { TorihikisakiPopupComponent } from './shared/torihikisaki-popup/torihikisaki-popup.component';

@NgModule({
  declarations: [
    AppComponent,
    JyucyuListComponent,
    JyucyuRegisterComponent,
    JyucyuIkkatsuComponent,
    TorihikisakiLinkCellRendererComponent,
    TorihikisakiPopupComponent
  ],
  imports: [BrowserModule, FormsModule, AppRoutingModule, AgGridModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}

