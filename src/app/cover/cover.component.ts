import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cover',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './cover.component.html',
  styleUrl: './cover.component.css'
})
export class CoverComponent {

  constructor(private router: Router) { } // Inject Router

  login() {
    this.router.navigate(['/login'])
  }

  signUp() {
    this.router.navigate(['/sign-up'])
  }

}
