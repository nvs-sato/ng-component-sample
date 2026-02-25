import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JyucyuListComponent } from './jyucyu/jyucyu-list/jyucyu-list.component';

const routes: Routes = [
  { path: '', redirectTo: 'jyucyu/list', pathMatch: 'full' },
  { path: 'jyucyu/list', component: JyucyuListComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
