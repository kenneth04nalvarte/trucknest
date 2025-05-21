import { collection, getDocs, where, query } from 'firebase/firestore';
import { db } from '@/config/firebase';
import AdminDashboardLayout from '../layout';
import PropertyVerificationTable from './PropertyVerificationTable';

async function getPendingProperties() {
  const q = query(collection(db, 'properties'), where('status', '==', 'pending'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name || 'Unnamed',
      address: data.address || 'No address',
      ownerId: data.ownerId || 'Unknown',
    };
  });
}

export default async function AdminPropertyVerification() {
  const properties = await getPendingProperties();

  return (
    <AdminDashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4 text-navy">Property Verification</h1>
        <PropertyVerificationTable initialProperties={properties} />
      </div>
    </AdminDashboardLayout>
  );
} 