import { Component } from '@angular/core';
import FFT from "fft.js";


@Component({
  selector: 'app-testing',
  standalone: true,
  imports: [],
  templateUrl: './testing.component.html',
  styleUrl: './testing.component.css'
})
export class TestingComponent {
constructor() {
  const fft = new FFT(256);

  console.log(fft);

}
  // const input = new Array(4096);
}
