// src/services/firestoreService.js
// All Firestore database operations for Securra

import {
  collection,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── REPORTS ────────────────────────────────────────────────────────────────

/** Ensure user document exists (called on login) - CREATES/PRESERVES USER DATA */
export const ensureUserExists = async (userId, userData = {}) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() === false) {
      // Create initial user document ONLY for brand new users
      const newUserData = {
        name: userData.name || "User",  // Use displayName from Firebase auth
        email: userData.email || "",
        phone: userData.phone || "",
        photoURL: userData.photoURL || "",
        totalReports: 0,
        verifiedReports: 0,
        fakeReports: 0,
        trustScore: 100,
        dispatchedReports: 0,
        role: "user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Use setDoc with merge: true to avoid wiping existing fields
      await setDoc(userRef, newUserData, { merge: true });
      console.log("✅ NEW user document created on login:");
      console.log("   Name:", userData.name);
      console.log("   Email:", userData.email);
      console.log("   Phone:", userData.phone || "(not set yet)");
    } else {
      // User already exists - LOG and PRESERVE all their data
      const existingData = userSnap.data();
      console.log("✅ EXISTING user found on login - preserving ALL data:");
      console.log("   Name:", existingData.name);
      console.log("   Email:", existingData.email);
      console.log("   Phone:", existingData.phone || "(not set)");
      console.log("   Role:", existingData.role);
      console.log("   Trust Score:", existingData.trustScore);
      console.log("   Total Reports:", existingData.totalReports);
    }
    return true;
  } catch (err) {
    console.error("❌ Could not ensure user document:", err.message);
    console.error("⚠️ This might be a security rule issue. Check Firebase rules:");
    console.error("   - Allow users to read/write their own /users/{userId} document");
    console.error("   - Allow users to create new documents in /users collection");
    return false;
  }
};

/** Submit a new emergency report */
export const submitReport = async (reportData, userProfile) => {
  // SECOND: Submit the report
  const ref = await addDoc(collection(db, "reports"), {
    ...reportData,
    status: "pending",           // pending | reviewing | verified | dispatched | fake
    confidence: 1,               // increases with multiple reports at same location
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // THIRD: Update user stats to save phone number and report count
  // NOTE: User document should be created on login via ensureUserExists()
  // This should ONLY update, never create a new profile
  if (reportData.userId) {
    try {
      const userRef = doc(db, "users", reportData.userId);

      // Just update the existing user doc - don't create new profiles here!
      await updateDoc(userRef, {
        phone: reportData.phone,
        totalReports: increment(1),
        updatedAt: serverTimestamp(),
      });
      console.log("✅ User stats updated - phone saved, report count incremented");
    } catch (err) {
      if (err.code === "not-found") {
        // User doc doesn't exist - this means ensureUserExists() failed on login
        console.warn("⚠️ User document not found. It should have been created on login via ensureUserExists()");
        console.warn("   Phone number will NOT be saved permanently for this report");
        console.warn("   ⚠️ Check your Firebase security rules and ensure user can create /users/{userId} documents");
      } else if (err.code === "permission-denied") {
        console.error("❌ Permission denied updating user document");
        console.error("   ⚠️ Check Firebase rules: users must be able to update their own /users/{userId} document");
        console.error("   Error:", err.message);
      } else {
        console.error("❌ Error updating user stats:", err.code, err.message);
      }
      // Continue anyway - report is still submitted even if user doc update fails
    }
  }

  return ref.id;
};

/** Listen to all reports in real-time (for map + admin) */
export const listenToReports = (callback) => {
  const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const reports = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(reports);
  });
};

/** Listen to reports for a specific user */
export const listenToUserReports = (userId, callback) => {
  const q = query(
    collection(db, "reports"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const reports = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(reports);
  });
};

/** Admin: update report status */
export const updateReportStatus = async (reportId, status) => {
  await updateDoc(doc(db, "reports", reportId), {
    status,
    updatedAt: serverTimestamp(),
  });
};

/** Admin: verify report with note and admin info */
export const verifyReport = async (reportId, adminId, verificationNote = "") => {
  const reportRef = doc(db, "reports", reportId);
  const reportSnap = await getDoc(reportRef);
  const reportData = reportSnap.data();

  await updateDoc(reportRef, {
    status: "verified",
    verifiedBy: adminId,
    verifiedAt: serverTimestamp(),
    verificationNote: verificationNote,
    updatedAt: serverTimestamp(),
  });

  // Try to update trust score, but don't fail if user doc doesn't exist
  if (reportData?.userId) {
    try {
      await updateTrustScore(reportData.userId, true);
      console.log("✅ Trust score updated");
    } catch (err) {
      console.warn("⚠️ Could not update trust score (user doc may not exist):", err.message);
      // Continue - report is already verified
    }
  }
};

/** Admin: mark report as fake with note and admin info */
export const markReportFake = async (reportId, adminId, verificationNote = "") => {
  const reportRef = doc(db, "reports", reportId);
  const reportSnap = await getDoc(reportRef);
  const reportData = reportSnap.data();

  await updateDoc(reportRef, {
    status: "fake",
    verifiedBy: adminId,
    verifiedAt: serverTimestamp(),
    verificationNote: verificationNote,
    updatedAt: serverTimestamp(),
  });

  // Try to update trust score, but don't fail if user doc doesn't exist
  if (reportData?.userId) {
    try {
      await updateTrustScore(reportData.userId, false);
      console.log("✅ Trust score updated (fake report)");
    } catch (err) {
      console.warn("⚠️ Could not update trust score (user doc may not exist):", err.message);
      // Continue - report is already marked as fake
    }
  }
};

/** Admin: dispatch emergency services - also marks as verified if not already */
export const dispatchEmergency = async (reportId, adminId, verificationNote = "") => {
  const reportRef = doc(db, "reports", reportId);
  const reportSnap = await getDoc(reportRef);
  const reportData = reportSnap.data();
  const wasVerified = reportData?.status === "verified" || reportData?.status === "dispatched";

  await updateDoc(reportRef, {
    status: "dispatched",
    verifiedBy: reportData?.verifiedBy || adminId,
    verifiedAt: reportData?.verifiedAt || serverTimestamp(),
    dispatchedBy: adminId,
    dispatchedAt: serverTimestamp(),
    verificationNote: verificationNote || reportData?.verificationNote,
    updatedAt: serverTimestamp(),
  });

  // Try to update user stats, but don't fail if user doc doesn't exist
  if (reportData?.userId) {
    try {
      await trackDispatchedReport(reportData.userId);
      console.log("✅ Dispatched report tracked");
      if (!wasVerified) {
        await updateTrustScore(reportData.userId, true);
        console.log("✅ Trust score updated (new dispatch)");
      }
    } catch (err) {
      console.warn("⚠️ Could not update user stats (user doc may not exist):", err.message);
      // Continue - report is already dispatched
    }
  }
};

/** Check nearby reports to boost confidence */
export const checkNearbyReports = async (lat, lng, type, radiusKm = 1) => {
  // Simple bounding box check (precise geoqueries need geohash library)
  const delta = radiusKm / 111;
  const q = query(
    collection(db, "reports"),
    where("type", "==", type),
    where("status", "in", ["pending", "reviewing", "verified"])
  );
  const snap = await getDocs(q);
  const nearby = snap.docs.filter((d) => {
    const r = d.data();
    return (
      Math.abs(r.lat - lat) < delta && Math.abs(r.lng - lng) < delta
    );
  });
  return nearby.length;
};

// ─── SOS ALERTS ─────────────────────────────────────────────────────────────

/** Send SOS alert */
export const sendSOS = async (userId, lat, lng, userName, phone) => {
  console.log("🆘 sendSOS called with:", { userId, lat, lng, userName, phone });
  try {
    const result = await addDoc(collection(db, "sos_alerts"), {
      userId,
      userName,
      phone,
      lat,
      lng,
      status: "active",
      createdAt: serverTimestamp(),
    });
    console.log("✅ SOS alert created with ID:", result.id);
    return result;
  } catch (e) {
    console.error("❌ Error creating SOS alert:", e);
    throw e;
  }
};

/** Listen to SOS alerts (admin) */
export const listenToSOS = (callback) => {
  console.log("👂 Listening to SOS alerts...");
  const q = query(
    collection(db, "sos_alerts"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    console.log("🆘 SOS data updated in admin:", snap.docs.length);
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (error) => {
    console.error("❌ Error listening to SOS alerts:", error);
  });
};

/** Listen to SOS alerts for a specific user */
export const listenToUserSOS = (userId, callback) => {
  const q = query(
    collection(db, "sos_alerts"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

/** Admin: respond to SOS alert */
export const respondToSOS = async (sosId, adminId) => {
  await updateDoc(doc(db, "sos_alerts", sosId), {
    status: "resolved",
    respondedBy: adminId,
    respondedAt: serverTimestamp(),
  });
};

// ─── USERS / REPUTATION ─────────────────────────────────────────────────────

/** Create or update user profile - PRESERVES ROLE */
export const upsertUser = async (userId, data) => {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    // User exists - preserve their existing role UNLESS we're explicitly updating it
    const existingRole = snap.data().role;
    const dataToUpdate = { ...data, updatedAt: serverTimestamp() };

    // Only override role if it's being explicitly provided in data
    if (!data.hasOwnProperty('role')) {
      dataToUpdate.role = existingRole;  // Preserve existing role
    }

    await updateDoc(ref, dataToUpdate);
    console.log("✅ User updated - role preserved:", existingRole);
  } else {
    // New user - set with provided data or default role
    await setDoc(ref, {
      ...data,
      totalReports: 0,
      verifiedReports: 0,
      fakeReports: 0,
      trustScore: 100,
      dispatchedReports: 0,
      role: data.role || "user",  // Use provided role or default to "user"
      createdAt: serverTimestamp(),
    });
    console.log("✅ New user created with role:", data.role || "user");
  }
};

/** Get user profile */
export const getUser = async (userId) => {
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (snap.exists()) {
      const data = snap.data();
      console.log("✅ Profile fetched for", userId);
      console.log("   Name:", data.name);
      console.log("   Email:", data.email);
      console.log("   Trust Score:", data.trustScore);
      console.log("   Total Reports:", data.totalReports);
      console.log("   Role:", data.role);
      return { id: snap.id, ...data };
    } else {
      console.warn("⚠️ No profile document exists for user", userId, "- Need to create it");
      return null;
    }
  } catch (err) {
    console.error("❌ Error fetching user profile:", err.code || err.name);
    console.error("   Message:", err.message);
    if (err.code === "permission-denied") {
      console.error("🔴 PERMISSION DENIED - Check Firestore security rules!");
    }
    // Don't throw - return null instead so timeout logic works
    return null;
  }
};

/** Set user as admin */
export const setUserAsAdmin = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // Update existing user to admin role
      await updateDoc(userRef, {
        role: "admin",
        updatedAt: serverTimestamp(),
      });
      console.log("✅ User set as admin");
      return true;
    } else {
      console.warn("⚠️ User document doesn't exist, cannot set as admin");
      return false;
    }
  } catch (err) {
    console.error("❌ Error setting user as admin:", err.message);
    return false;
  }
};

/** Get current user's role */
export const getUserRole = async (userId) => {
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? snap.data().role : null;
};

/** Set any user role - FORCE UPDATE */
export const setUserRole = async (userId, role) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // Update existing user's role
      await updateDoc(userRef, {
        role: role,
        updatedAt: serverTimestamp(),
      });
      console.log("✅ User role set to:", role);
      return true;
    } else {
      console.warn("⚠️ User document doesn't exist, cannot set role");
      return false;
    }
  } catch (err) {
    console.error("❌ Error setting user role:", err.message);
    return false;
  }
};

/** Update trust score after admin decision */
export const updateTrustScore = async (userId, isVerified) => {
  const ref = doc(db, "users", userId);
  const userSnap = await getDoc(ref);
  if (!userSnap.exists()) return;

  const userData = userSnap.data();
  const currentFake = userData.fakeReports || 0;

  // Calculate new totals
  const newFake = isVerified ? currentFake : currentFake + 1;
  // Logic: Base 100, subtract 15 for every fake report
  const newTrustScore = Math.max(0, 100 - (newFake * 15));

  await updateDoc(ref, {
    verifiedReports: isVerified ? increment(1) : increment(0),
    fakeReports: isVerified ? increment(0) : increment(1),
    trustScore: newTrustScore,
    updatedAt: serverTimestamp(),
  });
};

/** Track dispatched reports */
export const trackDispatchedReport = async (userId) => {
  const ref = doc(db, "users", userId);
  await updateDoc(ref, {
    dispatchedReports: increment(1),
    updatedAt: serverTimestamp(),
  });
};

/** Truly sync and recalculate trust score for a user based on actual reports in the database */
export const recalculateTrustScore = async (userId) => {
  const ref = doc(db, "users", userId);

  // 1. Get the actual counts for all statuses
  const [snapAll, snapFake, snapVerified, snapDispatched] = await Promise.all([
    getDocs(query(collection(db, "reports"), where("userId", "==", userId))),
    getDocs(query(collection(db, "reports"), where("userId", "==", userId), where("status", "==", "fake"))),
    getDocs(query(collection(db, "reports"), where("userId", "==", userId), where("status", "==", "verified"))),
    getDocs(query(collection(db, "reports"), where("userId", "==", userId), where("status", "==", "dispatched")))
  ]);

  const totalCount = snapAll.size;
  const fakeCount = snapFake.size;
  const verifiedCount = snapVerified.size + snapDispatched.size;
  const dispatchedCount = snapDispatched.size;

  // 2. Logic: Base 100, subtract 15 for every fake report (as per Setup Guide).
  const newTrustScore = Math.max(0, 100 - (fakeCount * 15));

  await updateDoc(ref, {
    fakeReports: fakeCount,
    verifiedReports: verifiedCount,
    dispatchedReports: dispatchedCount,
    totalReports: totalCount,
    trustScore: newTrustScore,
    updatedAt: serverTimestamp(),
  });
};

/** Directly update user's fake reports count and recalculate trust score */
export const updateUserFakeReports = async (userId, fakeCount) => {
  const ref = doc(db, "users", userId);
  const userSnap = await getDoc(ref);
  if (!userSnap.exists()) return;

  // Logic: Base 100, subtract 15 for every fake report
  const newTrustScore = Math.max(0, 100 - (fakeCount * 15));

  await updateDoc(ref, {
    fakeReports: fakeCount,
    trustScore: newTrustScore,
    updatedAt: serverTimestamp(),
  });
};

/** Listen to all users (admin) */
export const listenToUsers = (callback) => {
  return onSnapshot(collection(db, "users"), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

/** Add notification for a user */
export const addNotification = async (userId, message, type = "info") => {
  return addDoc(collection(db, "notifications"), {
    userId,
    message,
    type,
    read: false,
    createdAt: serverTimestamp(),
  });
};

/** Listen to notifications for user */
export const listenToNotifications = (userId, callback) => {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

/** Mark notification as read */
export const markNotificationRead = async (notifId) => {
  await updateDoc(doc(db, "notifications", notifId), { read: true });
};

// ─── ADMIN SETUP ─────────────────────────────────────────────────────────────

/** Admin: Create or upgrade user to admin */
export const createAdmin = async (userId, name, email, phone) => {
  await setDoc(doc(db, "users", userId), {
    name,
    email,
    phone,
    role: "admin",  // ⭐ ADMIN ROLE
    trustScore: 100,
    totalReports: 0,
    verifiedReports: 0,
    fakeReports: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/** Check if user is admin */
export const isUserAdmin = async (userId) => {
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() && snap.data().role === "admin";
};

/** Get all admins */
export const getAllAdmins = async () => {
  const q = query(collection(db, "users"), where("role", "==", "admin"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
