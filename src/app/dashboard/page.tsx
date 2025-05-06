"use client";

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
          setRole("trucker"); // fallback
        }
      };
      fetchRole();
    }
  }, [user, loading]);

  useEffect(() => {
    if (role) {
      if (role === "trucker") {
        router.replace("/trucker-dashboard");
      } else if (role === "property-owner" || role === "landowner") {
        router.replace("/landowner-dashboard");
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