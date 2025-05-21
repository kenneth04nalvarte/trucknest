'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export default function DashboardRedirect() {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const fetchRole = async () => {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const data = userDoc.data();
        if (data && data.role) {
          setRole(data.role);
        } else {
          setRole("truckmember"); // fallback
        }
      };
      fetchRole();
    }
  }, [user, loading]);

  useEffect(() => {
    if (role) {
      if (role === "truckmember") {
        router.replace("/truckmember-dashboard");
      } else if (role === "landmember") {
        router.replace("/landmember-dashboard");
      } else if (role === "admin") {
        router.replace("/admin-dashboard");
      } else {
        router.replace("/");
      }
    }
  }, [role, router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
    </div>
  );
}