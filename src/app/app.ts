import { Component } from '@angular/core';

import { Carteira } from './carteira/carteira';

@Component({
  selector: 'app-root',
  imports: [Carteira],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
