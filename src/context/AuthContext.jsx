// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange } from "../services/authService";
import { getUser, ensureUserExists } from "../services/firestoreService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);        // Firebase auth user
  const [profile, setProfile] = useState(null);  // Firestore user profile
  const [loading, setLoading] = useState(true);
  const [currentProfileName, setCurrentProfileName] = useState(null); // Preserve name

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          // STEP 1: Ensure user document exists on login
          try {
            const userData = {
              name: firebaseUser.displayName || "User",
              email: firebaseUser.email || "",
              phone: firebaseUser.phoneNumber || "",
              photoURL: firebaseUser.photoURL || "",
            };
            await ensureUserExists(firebaseUser.uid, userData);
            console.log("✅ ensureUserExists completed on login");
          } catch (ensureErr) {
            console.warn("⚠️ ensureUserExists failed (non-critical):", ensureErr.message);
          }

          // STEP 2: Try to fetch profile with timeout - GUARANTEED FALLBACK
          let fetchedProfile = null;
          try {
            const profilePromise = getUser(firebaseUser.uid);
            const timeoutPromise = new Promise((resolve) =>
              setTimeout(() => {
                console.warn("⏱️ Profile fetch TIMEOUT (10s) - using fallback");
                resolve(null);
              }, 10000)
            );

            fetchedProfile = await Promise.race([profilePromise, timeoutPromise]);
          } catch (fetchErr) {
            console.warn("⚠️ Profile fetch error:", fetchErr.message);
            fetchedProfile = null;
          }

          // Build profile from Firestore data OR Firebase auth as guaranteed fallback
          if (fetchedProfile) {
            // Use full profile from Firestore
            setProfile(fetchedProfile);
            setCurrentProfileName(fetchedProfile.name);
            console.log("✅ USING FIRESTORE DATA - Name:", fetchedProfile.name, "Email:", fetchedProfile.email, "Trust:", fetchedProfile.trustScore);
          } else {
            // Profile fetch failed/timed out - DO NOT create a full fake profile with stats
            const fallbackName = currentProfileName || firebaseUser.displayName || "Securra User";
            console.warn(`🔍 UID Check: Auth UID is ${firebaseUser.uid}. If this isn't jtWwrXAz2aRNGk7TXSfk9XOwF1p1, you are logged into the wrong account.`);
            const fallbackProfile = {
              id: firebaseUser.uid,
              name: fallbackName,
              email: firebaseUser.email || "",
              isFallback: true, // This flag is critical!
            };
            setProfile(fallbackProfile);
            console.warn("⚠️ USING FALLBACK - Profile fetch failed. Name:", fallbackName);
            console.warn("   ℹ️ Check browser console for errors. Your Firestore data is not being loaded!");
          }
        } else {
          setProfile(null);
          setCurrentProfileName(null);
        }
      } catch (error) {
        console.error("❌ Error in auth change:", error);
        // Emergency fallback - still show user's name
        if (firebaseUser) {
          const emergencyName = currentProfileName || firebaseUser.displayName || "User";
          setProfile({
            id: firebaseUser.uid,
            name: emergencyName,
            email: firebaseUser.email || "",
            phone: "",
            totalReports: 0,
            verifiedReports: 0,
            fakeReports: 0,
            trustScore: 100,
          });
          console.warn("⚠️ Emergency fallback - using name:", emergencyName);
        } else {
          setProfile(null);
          setCurrentProfileName(null);
        }
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []); // Only run once on mount

  const refreshProfile = async () => {
    if (user) {
      try {
        const p = await getUser(user.uid);
        if (p) {
          // Successfully fetched from Firestore
          setProfile(p);
          setCurrentProfileName(p.name); // ✅ Save name
          console.log("✅ Profile refreshed from Firestore - Trust Score:", p.trustScore);
        } else {
          // Fetch failed - COMPLETELY preserve existing profile!
          // Don't create fallback - that overwrites trust score and other data
          setProfile((current) => {
            if (current) {
              console.warn("⚠️ Profile fetch failed but keeping existing profile intact");
              console.warn("   Existing trustScore:", current.trustScore);
              console.warn("   Existing totalReports:", current.totalReports);
              return current; // Return EXACTLY as-is, don't modify anything
            }
            // ONLY create fallback if NO profile exists at all
            const fallbackName = user.displayName || "User";
            console.warn("⚠️ No existing profile - using default fallback");
            return {
              id: user.uid,
              name: fallbackName,
              email: user.email || "",
            };
          });
        }
      } catch (error) {
        console.error("❌ Error refreshing profile:", error);
        // Keep existing profile on error - NEVER overwrite
        setProfile((current) => current || {
          id: user.uid,
          name: user.displayName || "User",
          email: user.email || "",
        });
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
