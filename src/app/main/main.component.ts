import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import {FormsModule} from '@angular/forms';

import { CommonModule } from '@angular/common'; // Import CommonModule
import { Router } from '@angular/router';

interface Item {
  name: string;
  time: string;
}

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatListModule, MatDividerModule, MatIconModule],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})
export class MainComponent {
  items: Item[] = [
    { name: 'Item 1', time: '10:00 AM' },
    { name: 'Item 2', time: '11:00 AM' },
    { name: 'Item 3', time: '12:00 PM' },
  ];

  namaSiswa: string = '';
  namaGuru: string = '';

  constructor(private router: Router) {} // Inject Router

  deleteItem(index: number) {
    this.items.splice(index, 1);
  }

  viewDetails(item: Item) {
    console.log('Viewing details for:', item);
  }

  // Method untuk mengirim data ke halaman connection
  connect() {
     // Validasi apakah kedua input telah diisi
     if (this.namaSiswa && this.namaGuru) {
      this.router.navigate(['/connection'], {
        queryParams: {
          namaSiswa: this.namaSiswa,
          namaGuru: this.namaGuru
        }
      });
    } else {
      // Tampilkan pesan error jika belum diisi
      console.log("Nama siswa atau guru wajib diisi");
    }
  }
}
