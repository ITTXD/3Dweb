import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

function normalizeFiles(stlFiles) {
  if (!stlFiles) return [];
  return Array.isArray(stlFiles) ? stlFiles.filter(Boolean) : [stlFiles];
}

export async function saveOrder(orderData, stlFiles, onProgress) {
  const files = normalizeFiles(stlFiles);
  if (onProgress) onProgress(10);

  const docRef = await addDoc(collection(db, 'orders'), {
    ...orderData,
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  if (onProgress) onProgress(30);

  if (files.length > 0) {
    try {
      const fileURLs = [];
      const storagePaths = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const storageRef = ref(storage, `orders/${docRef.id}/${file.name}`);
        const progressBase = 30 + Math.floor((i / files.length) * 50);
        if (onProgress) onProgress(progressBase);

        const snapshot = await uploadBytes(storageRef, file);
        const fileURL = await getDownloadURL(snapshot.ref);
        fileURLs.push(fileURL);
        storagePaths.push(snapshot.ref.fullPath);
      }

      if (onProgress) onProgress(85);

      await updateDoc(doc(db, 'orders', docRef.id), {
        'model.fileURL': fileURLs[0] || '',
        'model.fileURLs': fileURLs,
        'model.storagePaths': storagePaths,
      });
    } catch (error) {
      console.warn('Firebase Storage upload failed. Order data was saved without STL files.', error);
      throw error;
    }
  }

  if (onProgress) onProgress(100);
  return docRef.id;
}

export function subscribeMaterials(callback) {
  const q = query(collection(db, 'materials'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(items);
  });
}

export async function addMaterial(data) {
  const docRef = await addDoc(collection(db, 'materials'), {
    ...data,
    available: data.available ?? true,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateMaterial(id, data) {
  await updateDoc(doc(db, 'materials', id), data);
}

export async function deleteMaterial(id) {
  await deleteDoc(doc(db, 'materials', id));
}

export async function deleteOrder(id) {
  await deleteDoc(doc(db, 'orders', id));
}
