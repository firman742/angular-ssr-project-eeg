import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // Import MatDialog
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MuseClient } from 'muse-js';
import { AgCharts } from 'ag-charts-angular';
import { AgCartesianChartOptions } from 'ag-charts-community';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component'; // Import dialog component
import { formatDate } from '@angular/common'; // Import formatDate function
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-connection',
  standalone: true,
  imports: [CommonModule, AgCharts, MatButtonModule, MatDialogModule], // Import MatDialogModule
  templateUrl: './connection.component.html',
  styleUrls: ['./connection.component.css'],
})
export class ConnectionComponent implements OnInit {
  // get data siswa
  namaSiswa: string = '';
  namaGuru: string = '';

  museClient: MuseClient;
  public chartOptions: AgCartesianChartOptions;
  eegChart: {
    time: number;
    TP9: number;
    AF7: number;
    AF8: number;
    TP10: number;
  }[] = [];
  eegData: any[] = [];
  sessionId: number = 1; // Example session ID
  deviceId: string = 'muse_device_1'; // Example device ID
  nis: number = 101;
  heartRate: number = 72;
  updateInterval: number = 10;
  updateIntervalId: any;
  isConnected: boolean = false;
  beforeFinished: boolean = false;

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router, public dialog: MatDialog) { // Inject MatDialog
    this.museClient = new MuseClient();
    this.chartOptions = {
      data: [],
      series: [
        { type: 'line', xKey: 'time', yKey: 'TP9', title: 'TP9' },
        { type: 'line', xKey: 'time', yKey: 'AF7', title: 'AF7' },
        { type: 'line', xKey: 'time', yKey: 'AF8', title: 'AF8' },
        { type: 'line', xKey: 'time', yKey: 'TP10', title: 'TP10' },
      ],
      axes: [
        { type: 'category', position: 'bottom', title: { text: 'Time (s)' } },
        {
          type: 'number',
          position: 'left',
          title: { text: 'EEG Signal (µV)' },
        },
      ],
    };
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.namaSiswa = params['namaSiswa'] || '';
      this.namaGuru = params['namaGuru'] || '';
    });
  }

  async connectMuse(): Promise<void> {
    try {
      await this.museClient.connect();
      await this.museClient.start();
      this.isConnected = true;

      let timeIndex = 0;

      this.museClient.eegReadings.subscribe((reading) => {
        const samples = reading.samples;

        // Simulate the process of getting frequency bands (e.g., Delta, Theta, Alpha, etc.)
        if (Array.isArray(samples) && samples.length >= 4) {
          const eegValue = {
            Delta_TP9: this.calculateFrequency(samples[0], 'Delta'),
            Delta_AF7: this.calculateFrequency(samples[1], 'Delta'),
            Delta_AF8: this.calculateFrequency(samples[2], 'Delta'),
            Delta_TP10: this.calculateFrequency(samples[3], 'Delta'),

            Theta_TP9: this.calculateFrequency(samples[0], 'Theta'),
            Theta_AF7: this.calculateFrequency(samples[1], 'Theta'),
            Theta_AF8: this.calculateFrequency(samples[2], 'Theta'),
            Theta_TP10: this.calculateFrequency(samples[3], 'Theta'),

            Alpha_TP9: this.calculateFrequency(samples[0], 'Alpha'),
            Alpha_AF7: this.calculateFrequency(samples[1], 'Alpha'),
            Alpha_AF8: this.calculateFrequency(samples[2], 'Alpha'),
            Alpha_TP10: this.calculateFrequency(samples[3], 'Alpha'),

            Gamma_TP9: this.calculateFrequency(samples[0], 'Gamma'),
            Gamma_AF7: this.calculateFrequency(samples[1], 'Gamma'),
            Gamma_AF8: this.calculateFrequency(samples[2], 'Gamma'),
            Gamma_TP10: this.calculateFrequency(samples[3], 'Gamma'),

            Beta_TP9: this.calculateFrequency(samples[0], 'Beta'),
            Beta_AF7: this.calculateFrequency(samples[1], 'Beta'),
            Beta_AF8: this.calculateFrequency(samples[2], 'Beta'),
            Beta_TP10: this.calculateFrequency(samples[3], 'Beta'),

            RAW_TP9: samples[0],
            RAW_AF7: samples[1],
            RAW_AF8: samples[2],
            RAW_TP10: samples[3],
          };

          this.eegData.push({
            timestamp: Date.now(),
            eegValue,
          });

          const RAW_TP9 = samples[0];
          const RAW_AF7 = samples[1];
          const RAW_AF8 = samples[2];
          const RAW_TP10 = samples[3];

          this.eegChart.push({
            time: timeIndex++,
            TP9: RAW_TP9,
            AF7: RAW_AF7,
            AF8: RAW_AF8,
            TP10: RAW_TP10,
          });
        }
      });

      // Send data to backend every 100ms
      if (!this.updateIntervalId) {
        this.startRealTimeUpdate();
      };
    } catch (error) {
      console.error('Error connecting to Muse:', error);
    }
  }

  async disconnectMuse(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.museClient.disconnect();
        this.stopRealTimeUpdate();
        this.isConnected = false;
        this.beforeFinished = true;

        console.log('Disconnected from Muse.');
      }
    } catch (error) {
      console.error('Error disconnecting from Muse:', error);
    }
  }

  // Open confirmation dialog when user clicks "Finish"
  finishScanning(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Data classification started...');
        // Simulate the classification process and redirect to result page
        setTimeout(() => {
          this.router.navigate(['/result']);
        }, 2000); // Simulate 2-second classification delay
      } else {
        console.log('User canceled the finish operation.');
      }
    });
  }

  startRealTimeUpdate(): void {
    this.updateIntervalId = setInterval(() => {

      if (this.eegData.length > 0) {
        this.updateChartData();
        this.sendDataToBackend();
      }
    }, this.updateInterval);
  }

  stopRealTimeUpdate(): void {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }
  }

  updateChartData(): void {
    this.chartOptions = {
      ...this.chartOptions,
      data: [...this.eegChart.slice(-100)], // Gunakan salinan
    };
  }


  calculateFrequency(sample: number, band: 'Delta' | 'Theta' | 'Alpha' | 'Beta' | 'Gamma'): number {
    const frequencyMap: Record<string, number> = {
      Delta: sample * 0.1,
      Theta: sample * 0.2,
      Alpha: sample * 0.3,
      Beta: sample * 0.4,
      Gamma: sample * 0.5,
    };
    return frequencyMap[band];
  }

  sendDataToBackend(): void {
    const timestamp = new Date(Date.now());
    const formattedTimestamp = formatDate(timestamp, 'yyyy-MM-dd HH:mm:ss', 'en-US'); // Format the date

    this.http
      .post('http://localhost:3000/api/eeg-data', {
        sessionId: this.sessionId++,
        deviceId: this.deviceId,
        timestamp: formattedTimestamp,
        eegValues: this.eegData,
      })
      .subscribe((response) => {
        console.log('Data sent successfully:', response);
        this.eegData = []; // Clear the buffer after sending
      });
  }

  fetchEEGData(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/eeg-data');
  }
}
