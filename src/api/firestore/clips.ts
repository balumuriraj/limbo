import { firestore } from "../../utils/firebaseUtils";

const collection = firestore.collection("clips");

export async function updateClip(id:string, data: any) {
  await collection.doc(id).update(data);
}

export async function getClip(id: string) {
  const snapshot = await collection.doc(id).get();
  return snapshot.data() as any;
}

export async function getClips() {
  const snapshot = await collection.get();
  const results: any[] = [];

  snapshot.forEach((doc) => {
    results.push({ id: doc.id, ...doc.data() });
  });

  return results;
}
