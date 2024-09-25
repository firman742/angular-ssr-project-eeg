import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataClassificationService {

  private classificationDataSubject = new BehaviorSubject<any>(null);
  classificationData$ = this.classificationDataSubject.asObservable();

  setClassificationData(data: any) {
    this.classificationDataSubject.next(data);
  }

  getClassificationData(): any {
    const currentData = this.classificationDataSubject.getValue();
    return currentData ? currentData.eegData : []; // Return eegData or an empty array
  }
}
