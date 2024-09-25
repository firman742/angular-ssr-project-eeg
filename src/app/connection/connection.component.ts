import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { MuseClient } from 'muse-js';
import { AgCharts } from 'ag-charts-angular';
import { AgCartesianChartOptions } from 'ag-charts-community';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { DataClassificationService } from '../data-classification.service';

@Component({
  selector: 'app-connection',
  standalone: true,
  imports: [CommonModule, AgCharts, MatButtonModule, MatDialogModule],
  templateUrl: './connection.component.html',
  styleUrls: ['./connection.component.css'],
})
export class ConnectionComponent implements OnInit, OnDestroy {
  namaSiswa: string = '';
  namaGuru: string = '';
  readinessLevel: string = '';
  museClient: MuseClient;
  public chartOptions: AgCartesianChartOptions;
  eegChart: Array<{ time: number; TP9: number; AF7: number; AF8: number; TP10: number }> = [];
  eegData: Array<any> = [];
  updateIntervalId: any;
  isConnected: boolean = false;
  beforeFinished: boolean = false;
  classificationResult: string = '';
  classificationProbability: number = 0;

  idClassification: number = 0;

  private queryParamsSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    public dialog: MatDialog,
    private dataClassificationService: DataClassificationService
  ) {
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
    this.queryParamsSubscription = this.route.queryParams.subscribe((params) => {
      this.namaSiswa = params['namaSiswa'] || '';
      this.namaGuru = params['namaGuru'] || '';
    });
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
    this.stopRealTimeUpdate();
  }

  async connectMuse(): Promise<void> {
    try {
      await this.museClient.connect();
      await this.museClient.start();
      this.isConnected = true;
      let timeIndex = 0;

      this.museClient.eegReadings.subscribe((reading) => {
        const samples = reading.samples;
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

          this.readinessLevel = this.classifyReadiness(eegValue); // Perform classification

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

  finishScanning(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Data classification started...');
        this.classificationProbability = this.calculateProbability(this.eegData); // Hitung probabilitas

        // Kirim data klasifikasi ke DataService
        this.dataClassificationService.setClassificationData({
          // data detail
          nama: this.namaSiswa,
          guru: this.namaGuru,
          waktu: new Date(),
          durasi: this.eegData.length,
          // hasil klasifikasi
          classificationResult: this.readinessLevel,
          probability: this.classificationProbability,
          metodePembelajaran: this.recommendLearningMethod(), // Rekomendasi metode pembelajaran
          deskripsi: this.generateDescription(), // Tambahkan deskripsi singkat
          // chart
          eegData: this.eegChart,
        });

        // Redirect to result page
        setTimeout(() => {
          this.router.navigate(['/result']);
        }, 2000);
      } else {
        console.log('User canceled the finish operation.');
      }
    });
  }

  calculateProbability(eegData: Array<any>): number {
    // Contoh penghitungan probabilitas berdasarkan rasio Beta dan Alpha power
    const betaPower = eegData.reduce((sum, entry) => sum + entry.eegValue.Beta_TP9, 0);
    const alphaPower = eegData.reduce((sum, entry) => sum + entry.eegValue.Alpha_TP9, 0);

    const probability = betaPower / (betaPower + alphaPower); // Rasio Beta terhadap total Beta+Alpha
    return Math.min(1, Math.max(0, probability)); // Pastikan nilai probabilitas antara 0 dan 1
  }

  generateDescription(): string {
    if (this.readinessLevel === 'KESIAPAN TINGGI') {
      return 'Siswa menunjukkan kesiapan tinggi untuk menerima pelajaran.';
    } else if (this.readinessLevel === 'KESIAPAN SEDANG') {
      return 'Siswa memiliki kesiapan sedang. Dapat diberikan lebih banyak motivasi.';
    } else if (this.readinessLevel === 'KESIAPAN RENDAH') {
      return 'Siswa membutuhkan perhatian lebih untuk meningkatkan kesiapan belajar.';
    } else {
      return "-"
    }
  }

  recommendLearningMethod(): string {
    if (this.readinessLevel === 'KESIAPAN TINGGI') {
      return 'Metode pembelajaran yang lebih interaktif seperti diskusi atau praktik akan efektif.';
    } else if (this.readinessLevel === 'KESIAPAN SEDANG') {
      return 'Metode pembelajaran berbasis proyek dengan tambahan motivasi bisa membantu siswa.';
    } else if (this.readinessLevel === 'KESIAPAN RENDAH') {
      return 'Pendekatan yang lebih personal dan penggunaan metode visualisasi dapat meningkatkan kesiapan belajar.';
    } else {
      return '-';
    }
  }

  calculateFrequency(sample: number, band: string): number {
    // Lakukan perhitungan band EEG (Delta, Theta, Alpha, Beta, Gamma)
    switch (band) {
      case 'Delta':
        return sample * 0.1; // Contoh perhitungan band Delta
      case 'Theta':
        return sample * 0.2;
      case 'Alpha':
        return sample * 0.3;
      case 'Beta':
        return sample * 0.4;
      case 'Gamma':
        return sample * 0.5;
      default:
        return 0;
    }
  }

  classifyReadiness(eegValue: any): string {
    const betaPower = eegValue.Beta_TP9 + eegValue.Beta_AF7 + eegValue.Beta_AF8 + eegValue.Beta_TP10;
    const alphaPower = eegValue.Alpha_TP9 + eegValue.Alpha_AF7 + eegValue.Alpha_AF8 + eegValue.Alpha_TP10;
    const thetaPower = eegValue.Theta_TP9 + eegValue.Theta_AF7 + eegValue.Theta_AF8 + eegValue.Theta_TP10;

    // Dominasi Beta: Kesiapan Tinggi
    if (betaPower > alphaPower && betaPower > thetaPower) {
      return 'KESIAPAN TINGGI';
    }
    // Dominasi Alpha: Kesiapan Sedang
    else if (alphaPower > betaPower && alphaPower > thetaPower) {
      return 'KESIAPAN SEDANG';
    }
    // Dominasi Theta: Kesiapan Rendah
    else if (thetaPower > betaPower && thetaPower > alphaPower) {
      return 'KESIAPAN RENDAH';
    }
    // Jika perbandingannya tidak jelas, misalnya dua atau lebih band sama, bisa disesuaikan
    else {
      return 'KESIAPAN TIDAK TERDETEKSI';
    }
  }

  startRealTimeUpdate() {
    const maxDataPoints = 100; // Batasi jumlah titik data, misalnya 100
    this.updateIntervalId = setInterval(() => {
      // Hanya simpan data terakhir sebanyak maxDataPoints
      if (this.eegChart.length > maxDataPoints) {
        this.eegChart = this.eegChart.slice(this.eegChart.length - maxDataPoints);
      }

      this.chartOptions = { ...this.chartOptions, data: [...this.eegChart] };
    }, 1000);
  }


  stopRealTimeUpdate() {
    clearInterval(this.updateIntervalId);
    this.updateIntervalId = null;
  }
}
