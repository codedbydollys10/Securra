// src/services/authService.js
// Firebase Authentication — Phone OTP + Email/Password + Google OAuth

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "./firebase";
import { upsertUser, ensureUserExists } from "./firestoreService";

/** Register with email + password */
export const registerUser = async (email, password, name, phone) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await upsertUser(cred.user.uid, { name, email, phone, role: "user" });
  // Sign out immediately after registration - user must login manually
  await signOut(auth);
  return cred.user;
};

/** Login with email + password */
export const loginUser = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

/** Logout */
export const logoutUser = () => signOut(auth);

/** Setup invisible reCAPTCHA for phone OTP */
export const setupRecaptcha = (containerId) => {
  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
  });
};

/** Send real OTP to phone number via Firebase */
export const sendRealPhoneOTP = async (phoneNumber, recaptchaContainerId = "recaptcha-container") => {
  try {
    // Setup reCAPTCHA if not already set up
    if (!window.recaptchaVerifier) {
      // Create container if it doesn't exist
      if (!document.getElementById(recaptchaContainerId)) {
        const container = document.createElement("div");
        container.id = recaptchaContainerId;
        container.style.display = "none";
        document.body.appendChild(container);
      }
      setupRecaptcha(recaptchaContainerId);
    }

    // Format phone number to international format if needed
    let formattedPhone = phoneNumber;
    if (!phoneNumber.startsWith("+")) {
      // Assume India (+91) if no country code provided
      formattedPhone = "+91" + phoneNumber.replace(/\D/g, "");
    }

    // Send OTP via Firebase
    const result = await signInWithPhoneNumber(
      auth,
      formattedPhone,
      window.recaptchaVerifier
    );
    
    window.confirmationResult = result;
    return result;
  } catch (error) {
    console.error("Phone OTP Error:", error);
    throw new Error(error.message || "Failed to send OTP. Check phone number format.");
  }
};

/** Verify OTP */
export const verifyOTP = async (otp) => {
  if (!window.confirmationResult) throw new Error("No OTP sent");
  const cred = await window.confirmationResult.confirm(otp);
  return cred.user;
};

/** Clear OTP confirmation */
export const clearOTPConfirmation = () => {
  window.confirmationResult = null;
};

/** Listen to auth state changes */
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

/** Login with Google OAuth */
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  // Add custom parameters if needed
  provider.addScope('profile');
  provider.addScope('email');
  
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  
  // Ensure user document exists in Firestore
  const userData = {
    name: user.displayName || "User",
    email: user.email || "",
    phone: user.phoneNumber || "",
    photoURL: user.photoURL || "",
  };
  
  await ensureUserExists(user.uid, userData);
  
  return user;
};
