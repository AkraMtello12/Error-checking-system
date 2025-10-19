import { type DocumentReference, type Timestamp } from 'firebase/firestore';

export interface Employee {
  id: string;
  name: string;
}

export interface ErrorCategory {
  id: string;
  name: string;
}

export interface ErrorType {
  id: string;
  name: string;
  categoryRef: DocumentReference;
}

export interface ErrorLog {
  id: string;
  employeeRef: DocumentReference;
  typeRef: DocumentReference;
  created_at: Timestamp;
}

export interface PopulatedErrorLog extends Omit<ErrorLog, 'employeeRef' | 'typeRef'> {
    employeeId: string;
    employeeName: string;
    errorTypeName: string;
    errorCategoryName: string;
    categoryId: string;
}