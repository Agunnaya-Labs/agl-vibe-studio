/**
 * Firestore Utility Functions
 * Provides type-safe operations with user-scoped data access and proper error handling
 */

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  writeBatch,
  Query,
  QueryConstraint,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { errorHandler, ErrorCodes } from './errorHandler';

/**
 * Get current user ID (for user-scoped queries)
 */
export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid || null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!auth.currentUser;
}

/**
 * Fetch documents with user-scoped access
 */
export async function fetchUserData<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User must be authenticated to fetch user data');
    }

    // Add user ID constraint for safety
    const userConstraint = where('userId', '==', userId);
    const q = query(collection(db, collectionName), userConstraint, ...constraints);
    const snapshot = await getDocs(q);

    const data: T[] = [];
    snapshot.forEach(doc => {
      data.push({ id: doc.id, ...doc.data() } as T);
    });

    return data;
  } catch (error) {
    errorHandler.handle(
      error,
      ErrorCodes.FIREBASE_READ_FAILED,
      'error',
      { collection: collectionName }
    );
    throw error;
  }
}

/**
 * Fetch public documents (no user scoping)
 */
export async function fetchPublicData<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const q = query(collection(db, collectionName), ...constraints);
    const snapshot = await getDocs(q);

    const data: T[] = [];
    snapshot.forEach(doc => {
      data.push({ id: doc.id, ...doc.data() } as T);
    });

    return data;
  } catch (error) {
    errorHandler.handle(
      error,
      ErrorCodes.FIREBASE_READ_FAILED,
      'error',
      { collection: collectionName }
    );
    throw error;
  }
}

/**
 * Create a new document
 */
export async function createDocument<T extends Record<string, any>>(
  collectionName: string,
  data: T,
  addUserId: boolean = true
): Promise<string> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User must be authenticated to create documents');
    }

    const dataWithUser = addUserId ? { ...data, userId, createdAt: Date.now() } : data;
    const docRef = await addDoc(collection(db, collectionName), dataWithUser);

    return docRef.id;
  } catch (error) {
    errorHandler.handle(
      error,
      ErrorCodes.FIREBASE_WRITE_FAILED,
      'error',
      { collection: collectionName, operation: 'create' }
    );
    throw error;
  }
}

/**
 * Update a document
 */
export async function updateDocument<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User must be authenticated to update documents');
    }

    const docRef = doc(db, collectionName, docId);
    const dataWithTimestamp = { ...data, updatedAt: Date.now() };

    await updateDoc(docRef, dataWithTimestamp);
  } catch (error) {
    errorHandler.handle(
      error,
      ErrorCodes.FIREBASE_WRITE_FAILED,
      'error',
      { collection: collectionName, docId, operation: 'update' }
    );
    throw error;
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User must be authenticated to delete documents');
    }

    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    errorHandler.handle(
      error,
      ErrorCodes.FIREBASE_WRITE_FAILED,
      'error',
      { collection: collectionName, docId, operation: 'delete' }
    );
    throw error;
  }
}

/**
 * Batch write operations
 */
export async function batchWrite(
  operations: Array<{
    type: 'set' | 'update' | 'delete';
    collection: string;
    docId: string;
    data?: Record<string, any>;
  }>
): Promise<void> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User must be authenticated for batch operations');
    }

    const batch = writeBatch(db);

    operations.forEach(op => {
      const docRef = doc(db, op.collection, op.docId);

      if (op.type === 'set') {
        batch.set(docRef, { ...op.data, userId, createdAt: Date.now() });
      } else if (op.type === 'update') {
        batch.update(docRef, { ...op.data, updatedAt: Date.now() });
      } else if (op.type === 'delete') {
        batch.delete(docRef);
      }
    });

    await batch.commit();
  } catch (error) {
    errorHandler.handle(
      error,
      ErrorCodes.FIREBASE_WRITE_FAILED,
      'error',
      { operation: 'batch-write', count: operations.length }
    );
    throw error;
  }
}

/**
 * Count documents in a collection
 */
export async function countDocuments(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<number> {
  try {
    const q = query(collection(db, collectionName), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    errorHandler.handle(
      error,
      ErrorCodes.FIREBASE_READ_FAILED,
      'warning',
      { collection: collectionName, operation: 'count' }
    );
    return 0;
  }
}

/**
 * Validate Firestore connection
 */
export async function validateConnection(): Promise<boolean> {
  try {
    const testRef = doc(db, 'system', 'connection-test');
    await setDoc(testRef, { lastChecked: Date.now() }, { merge: true });
    return true;
  } catch (error) {
    errorHandler.handle(
      error,
      ErrorCodes.FIREBASE_OFFLINE,
      'warning',
      { operation: 'connection-test' }
    );
    return false;
  }
}
