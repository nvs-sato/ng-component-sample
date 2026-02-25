import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { ModuleRegistry } from 'ag-grid-community';
import {
  ClipboardModule,
  ExcelExportModule,
  MasterDetailModule,
  MenuModule,
  RangeSelectionModule
} from 'ag-grid-enterprise';

import { AppModule } from './app/app.module';

ModuleRegistry.registerModules([
  MenuModule,
  ClipboardModule,
  ExcelExportModule,
  MasterDetailModule,
  RangeSelectionModule
]);

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));

