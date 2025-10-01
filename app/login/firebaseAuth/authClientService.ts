// authClientService.ts
import { makeApiRequest } from "@/utils/api/api";
import { auth } from "@/utils/firebase/firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, UserCredential, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo, getIdTokenResult, sendPasswordResetEmail, confirmPasswordReset } from "firebase/auth";


export const registerUser = async (email: string, password: string): Promise<UserCredential> => {
    if (!auth) {
        throw new Error("Firebase auth is not initialized.");
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        const success = await createDefaultNewAccount(idToken);
        userCredential.user.getIdToken(true);
        return userCredential; // Return the user credential object
    } catch (error) {
        console.error("Error registering user:", error);
        throw error; // Rethrow the error for handling in the UI
    }
};

export const loginUser = async (email: string, password: string): Promise<UserCredential> => {
    if (!auth) {
        throw new Error("Firebase auth is not initialized.");
    }
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential; // Return the user credential object
    } catch (error) {
        console.error("Error logging in:", error);
        throw error; // Rethrow the error for handling in the UI
    }
};

export const logoutUser = async (): Promise<void> => {
    if (!auth) {
        throw new Error("Firebase auth is not initialized.");
    }
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out:", error);
        throw error; // Rethrow the error for handling in the UI
    }
};

export const loginWithGoogle = async (): Promise<UserCredential> => {
    if (!auth) {
        throw new Error("Firebase auth is not initialized.");
    }
    const provider = new GoogleAuthProvider();
    try {
        const userCredential = await signInWithPopup(auth, provider);
        const isNewUser = getAdditionalUserInfo(userCredential)?.isNewUser;
        if (isNewUser) {
            const idToken = await userCredential.user.getIdToken();
            const success = await createDefaultNewAccount(idToken);
            userCredential.user.getIdToken(true);
        }
        return userCredential; // Return the user credential object
    } catch (error) {
        console.error("Error logging in with Google:", error);
        throw error; // Rethrow the error for handling in the UI
    }
};

export const sendResetPassword = async (email: string): Promise<void> => {
    if (!auth) {
        throw new Error("Firebase auth is not initialized.");
    }
    
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw error; // Rethrow the error for handling in the UI
    }
}

export const resetPasswordFromCode = async (resetToken: string, newPassword: string): Promise<void> => {
    if (!auth) {
        throw new Error("Firebase auth is not initialized.");
    }
    
    try {
        await confirmPasswordReset(auth, resetToken, newPassword);
    } catch (error) {
        console.error("Error resetting password:", error);
        throw error; // Rethrow the error for handling in the UI
    }
}

const createDefaultNewAccount = async (idToken: string): Promise<string> => {
    try {
        const apiRoute = `/api/account/initializeUserObjects`;
        const result = await makeApiRequest('POST', apiRoute, {}, true);
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.error?.message || "Failed to create new account");
        }
    } catch (error) {
        console.error("Error calling API to create new account objects:", error);
        throw error;
    }
}

export const getUserCustomClaims = async () => {
    if (!auth) {
        throw new Error("Firebase auth is not initialized.");
    }
    const user = auth.currentUser;
    if (user) {
      try {
        // Get the ID token and decode the custom claims
        const idTokenResult = await getIdTokenResult(user);
        const customClaims = idTokenResult.claims;  // Contains your custom claims
        
        const role = customClaims.role;  // Assuming you set a custom claim named role
        console.log('Role:', role);
      } catch (error) {
        console.error('Error fetching custom claims:', error);
      }
    }
  };

export const fetchAccountObjects = async () => {
    if (!auth || !auth.currentUser) {
        throw new Error("Firebase auth is not initialized or no user is logged in.");
    }
    try {
        const apiRoute = `/api/auth/getAccountObjects`;
        const result = await makeApiRequest('GET', apiRoute, {}, true);
        if (result.success) {
            return result.data;
        } else {
            console.error("Error calling API to fetch objects:", result.error);
            throw new Error(result.error?.message || "Failed to fetch account objects");
        }
    } catch (error) {
        console.error("Error calling API to fetch objects:", error);
        throw error;
    }
}