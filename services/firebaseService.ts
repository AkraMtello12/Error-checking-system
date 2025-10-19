import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  Timestamp,
  type DocumentReference,
  addDoc,
  deleteDoc,
  writeBatch,
  updateDoc,
} from 'firebase/firestore';
import { type Employee, type ErrorCategory, type ErrorType, type PopulatedErrorLog, type ErrorLog } from '../types';

// IMPORTANT: Replace with your Firebase project's configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWtJe02j9DBkvLyWpLaIPgHlqHwL3qBmE",
  authDomain: "error-checking-system.firebaseapp.com",
  projectId: "error-checking-system",
  storageBucket: "error-checking-system.firebasestorage.app",
  messagingSenderId: "29702022947",
  appId: "1:29702022947:web:5c690826ddfee0ec378e96"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Collections
const employeesCollection = collection(db, 'employees');
const errorCategoriesCollection = collection(db, 'errorCategories');
const errorTypesCollection = collection(db, 'errorTypes');
const errorLogsCollection = collection(db, 'errorLogs');

// Helper to get data from reference
const getDataFromRef = async <T>(ref: DocumentReference): Promise<(T & { id: string }) | null> => {
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T & { id: string };
  }
  return null;
};

export const getFilteredErrorLogs = async (month: number, year: number): Promise<PopulatedErrorLog[]> => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);

  const constraints = [
    where('created_at', '>=', startTimestamp),
    where('created_at', '<', endTimestamp)
  ];

  const q = query(errorLogsCollection, ...constraints);

  const querySnapshot = await getDocs(q);
  const logs: ErrorLog[] = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as ErrorLog));

  const populatedLogs = await Promise.all(
    logs.map(async (log) => {
      if (!log.employeeRef || !log.typeRef) return null;
      
      const employee = await getDataFromRef<Employee>(log.employeeRef);
      const errorType = await getDataFromRef<ErrorType>(log.typeRef);
      
      if (!employee || !errorType || !errorType.categoryRef) return null;
      
      const errorCategory = await getDataFromRef<ErrorCategory>(errorType.categoryRef);

      if (!errorCategory) return null;

      return {
        id: log.id,
        created_at: log.created_at,
        employeeId: employee.id,
        employeeName: employee.name,
        errorTypeName: errorType.name,
        errorCategoryName: errorCategory.name,
        categoryId: errorCategory.id,
      };
    })
  );

  return populatedLogs.filter((log): log is PopulatedErrorLog => log !== null);
};

// --- Employee Management ---
export const getEmployees = async (): Promise<Employee[]> => {
    const snapshot = await getDocs(employeesCollection);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Employee));
};

export const addEmployee = (name: string) => addDoc(employeesCollection, { name });

export const deleteEmployee = async (id: string): Promise<void> => {
    const employeeDocRef = doc(db, 'employees', id);
    const batch = writeBatch(db);

    // Find and delete related error logs
    const logsQuery = query(errorLogsCollection, where('employeeRef', '==', employeeDocRef));
    const logsSnapshot = await getDocs(logsQuery);
    logsSnapshot.forEach(logDoc => batch.delete(logDoc.ref));

    // Delete the employee
    batch.delete(employeeDocRef);
    await batch.commit();
};

// --- Error Category Management ---
export const getErrorCategories = async (): Promise<ErrorCategory[]> => {
    const snapshot = await getDocs(errorCategoriesCollection);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ErrorCategory));
};

export const addErrorCategory = (name: string) => addDoc(errorCategoriesCollection, { name });

export const updateErrorCategory = (id: string, name: string) => {
    const categoryDocRef = doc(db, 'errorCategories', id);
    return updateDoc(categoryDocRef, { name });
};

export const deleteErrorCategory = async (id: string): Promise<void> => {
    const batch = writeBatch(db);
    const categoryDocRef = doc(db, 'errorCategories', id);

    // 1. Find all related error types
    const typesQuery = query(errorTypesCollection, where('categoryRef', '==', categoryDocRef));
    const typesSnapshot = await getDocs(typesQuery);

    // 2. For each type, find and schedule deletion of its logs
    // We need to do this in a loop with awaits because we are querying inside the loop
    const logDeletionPromises = typesSnapshot.docs.map(async (typeDoc) => {
        const logsQuery = query(errorLogsCollection, where('typeRef', '==', typeDoc.ref));
        const logsSnapshot = await getDocs(logsQuery);
        logsSnapshot.forEach(logDoc => {
            batch.delete(logDoc.ref);
        });
        // 3. Schedule the type itself for deletion
        batch.delete(typeDoc.ref);
    });

    // Wait for all log queries to complete before proceeding
    await Promise.all(logDeletionPromises);
    
    // 4. Schedule the category for deletion
    batch.delete(categoryDocRef);

    // 5. Commit the atomic batch
    await batch.commit();
};


// --- Error Type Management ---
export const getErrorTypes = async (): Promise<(ErrorType & { categoryName: string })[]> => {
    const snapshot = await getDocs(errorTypesCollection);
    const types = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ErrorType));
    
    const populatedTypes = await Promise.all(types.map(async (type) => {
        if (!type.categoryRef) {
            return {...type, categoryName: '—'}
        }
        const category = await getDataFromRef<ErrorCategory>(type.categoryRef);
        return {
            ...type,
            categoryName: category?.name || 'تصنيف محذوف'
        };
    }));
    return populatedTypes;
};

export const addErrorType = (name: string, categoryId: string) => {
    const categoryRef = doc(db, 'errorCategories', categoryId);
    return addDoc(errorTypesCollection, { name, categoryRef });
};

export const deleteErrorType = async (id: string): Promise<void> => {
    const typeDocRef = doc(db, 'errorTypes', id);
    const batch = writeBatch(db);

    // Find and delete related error logs
    const logsQuery = query(errorLogsCollection, where('typeRef', '==', typeDocRef));
    const logsSnapshot = await getDocs(logsQuery);
    logsSnapshot.forEach(logDoc => batch.delete(logDoc.ref));

    // Delete the error type
    batch.delete(typeDocRef);
    await batch.commit();
};

// --- Error Log Management ---
export const addErrorLog = (employeeId: string, typeId: string) => {
    const employeeRef = doc(db, 'employees', employeeId);
    const typeRef = doc(db, 'errorTypes', typeId);
    return addDoc(errorLogsCollection, {
        employeeRef,
        typeRef,
        created_at: Timestamp.now()
    });
};

export const deleteErrorLog = (id: string) => {
    const logDocRef = doc(db, 'errorLogs', id);
    return deleteDoc(logDocRef);
};