import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Arranca a aplicacao Angular no browser.
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
