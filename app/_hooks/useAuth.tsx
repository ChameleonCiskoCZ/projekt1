

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import firebase_app from "@/firebase";

export const useAuth = () => {
    const [username, setUsername] = useState<string | null>(null);
    const router = useRouter();
      const auth = getAuth(firebase_app);

 useEffect(() => {
   const unsubscribe = onAuthStateChanged(auth, (user) => {
     if (user) {
       setUsername(user.displayName);
     } else {
       setUsername(null);
       router.push("/login");
     }
   });

   // Clean up the subscription on unmount
   return () => unsubscribe();
 }, [router, auth]);

  return username;
};
