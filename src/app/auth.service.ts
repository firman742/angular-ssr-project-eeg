import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loggedIn = false; // Initial authentication state

  // Simulate login
  login(username: string, password: string): boolean {
    if (username === 'admin' && password === 'password') {
      this.loggedIn = true; // Set user as logged in
      return true;
    }
    return false; // Authentication failed
  }

  // Check if user is logged in
  isAuthenticated(): boolean {
    return this.loggedIn;
  }

  // Log out user
  logout(): void {
    this.loggedIn = false; // Set user as logged out
  }
}
