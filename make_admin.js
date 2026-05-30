// Quick script to set a user as admin
// Run this in browser console while logged in as the user you want to make admin

import { auth } from "./src/services/firebase.js";
import { setUserAsAdmin, getUserRole } from "./src/services/firestoreService.js";

async function makeAdminUser() {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      console.error("❌ Not logged in!");
      return;
    }
    
    console.log(`👤 Current user: ${user.displayName} (${user.uid})`);
    
    // Check current role
    const currentRole = await getUserRole(user.uid);
    console.log(`📋 Current role: ${currentRole || "none"}`);
    
    // Set as admin
    const success = await setUserAsAdmin(user.uid);
    
    if (success) {
      console.log("✅ User is now ADMIN!");
      const newRole = await getUserRole(user.uid);
      console.log(`✅ Verified role: ${newRole}`);
    } else {
      console.log("❌ Failed to set user as admin");
    }
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

// Run it
makeAdminUser();
