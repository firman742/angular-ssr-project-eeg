import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card'; // Import MatCardModule


@Component({
  selector: 'app-result',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './result.component.html',
  styleUrl: './result.component.css'
})
export class ResultComponent {
  eegData: any = null; // Initialize eegData to null or an empty object

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchEEGData().subscribe(
      (data) => {
        this.eegData = data; // Store the fetched data
      },
      (error) => {
        console.error('Error fetching EEG data:', error); // Handle error
      }
    );
  }

  fetchEEGData(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/eeg-data');
  }
}
