import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ComponentTestPageComponent } from './component/component-test-page/component-test-page.component';
import { JyucyuListComponent } from './jyucyu/jyucyu-list/jyucyu-list.component';
import { JyucyuIkkatsuComponent } from './jyucyu/jyucyu-ikkatsu/jyucyu-ikkatsu.component';
import { JyucyuRegisterComponent } from './jyucyu/jyucyu-register/jyucyu-register.component';

const routes: Routes = [
  { path: '', redirectTo: 'jyucyu/list', pathMatch: 'full' },
  { path: 'jyucyu/list', component: JyucyuListComponent },
  { path: 'jyucyu/register', component: JyucyuRegisterComponent },
  { path: 'jyucyu/ikkatsu', component: JyucyuIkkatsuComponent },
  { path: 'component/:shubetu', component: ComponentTestPageComponent },
  // 編集画面は登録画面コンポーネントを再利用する
  { path: 'jyucyu/edit', component: JyucyuRegisterComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
