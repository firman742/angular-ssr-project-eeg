import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card'; // Import MatCardModule
import { ActivatedRoute } from '@angular/router';
import { DataClassificationService } from '../data-classification.service';
import { formatDate } from '@angular/common';
import { AgCharts } from 'ag-charts-angular';
import { AgCartesianChartOptions } from 'ag-charts-community';
import { CommonModule } from '@angular/common'; // Import CommonModule


@Component({
  selector: 'app-result',
  standalone: true,
  imports: [MatCardModule, AgCharts, CommonModule],
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.css'] // Corrected to `styleUrls`
})
export class ResultComponent implements OnInit {
  public chartOptions: AgCartesianChartOptions;
  public isChartReady = false; // Flag for chart readiness

  idClassification: string | null = null;
  eegData: any = null; // Initialize eegData to hold the result data
  eegChart: Array<{ time: number; TP9: number; AF7: number; AF8: number; TP10: number }> = [];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private dataClassificationService: DataClassificationService
  ) {
    this.chartOptions = {
      data: this.eegChart,
      series: [
        { type: 'line', xKey: 'time', yKey: 'TP9', title: 'TP9' },
        { type: 'line', xKey: 'time', yKey: 'AF7', title: 'AF7' },
        { type: 'line', xKey: 'time', yKey: 'AF8', title: 'AF8' },
        { type: 'line', xKey: 'time', yKey: 'TP10', title: 'TP10' },
      ],
      axes: [
        { type: 'category', position: 'bottom', title: { text: 'Time (s)' } },
        { type: 'number', position: 'left', title: { text: 'EEG Signal (µV)' } },
      ],
    };
  }

  ngOnInit(): void {
    // Subscribe to classification data
    this.dataClassificationService.classificationData$.subscribe(data => {
      if (data) {
        this.displayClassificationData(data); // Call function to display data
        this.eegChart = data.eegData || []; // Retrieve EEG data
        setTimeout(() => {
          this.isChartReady = true; // Set chart ready to true after timeout
          this.updateChartData(); // Update chart data
        }, 0);
      }
    });
  }

  displayClassificationData(data: any): void {
    const milisecond = 1000.0;
    const formattedTimestamp = formatDate(data.waktu, 'yyyy-MM-dd HH:mm:ss', 'en-US');
    data.waktu = formattedTimestamp;
    data.durasiPerSecond = data.durasi / milisecond;
    console.log('Classification Result:', data.classificationResult);
    this.eegData = data; // Set data as needed for display
  }

  updateChartData(): void {
    this.chartOptions = { ...this.chartOptions, data: this.eegChart }; // Ensure data is from eegChart
  }
}
