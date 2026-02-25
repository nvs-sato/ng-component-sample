import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { ModuleRegistry } from 'ag-grid-community';
import {
  ClipboardModule,
  MasterDetailModule,
  MenuModule,
  RangeSelectionModule
} from 'ag-grid-enterprise';

import { AppModule } from './app/app.module';

ModuleRegistry.registerModules([
  MenuModule,
  ClipboardModule,
  MasterDetailModule,
  RangeSelectionModule
]);

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
