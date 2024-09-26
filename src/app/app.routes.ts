import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ConnectionComponent } from './connection/connection.component';
import { MainComponent } from './main/main.component';
import { ResultComponent } from './result/result.component';
import { AppComponent } from './app.component';
import { CoverComponent } from './cover/cover.component';
import { AuthGuard } from './auth.guard';

const routes: Routes = [
  { path: '', component: CoverComponent }, // Halaman Cover
  { path: 'app', component: AppComponent }, // Halaman App
  { path: 'main', component: MainComponent, canActivate: [AuthGuard] }, // Halaman Utama
  { path: 'connection', component: ConnectionComponent }, // Halaman koneksi
  { path: 'result', component: ResultComponent, canActivate: [AuthGuard] }, // Halaman Hasil
  { path: 'login', component: LoginComponent }, // Halaman Login
  { path: '**', redirectTo: '/login' }, // Redirect any unknown paths to login
];

export { routes };
