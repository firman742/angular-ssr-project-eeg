import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-result',
  standalone: true,
  imports: [],
  templateUrl: './result.component.html',
  styleUrl: './result.component.css'
})
export class ResultComponent {
  constructor(private http: HttpClient) {}

  fetchEEGData(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/eeg-data');
  }
}
