import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDI4ih1VqmvLivlpTxbc4SMXmyorqAFLDI",
  authDomain: "gen-lang-client-0534190127.firebaseapp.com",
  projectId: "gen-lang-client-0534190127",
  storageBucket: "gen-lang-client-0534190127.firebasestorage.app",
  messagingSenderId: "453483875559",
  appId: "1:453483875559:web:6a2c8b8a498c8df7f1a642"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Document reference for our unified state
const stateDocRef = doc(db, "mosque_app_data", "main_state");

// Expose sync functions globally so app.js can use them without being a module
window.FirebaseSync = {
    isUploading: false,
    
    // Push local state to Firestore
    pushState: async (stateObj) => {
        window.FirebaseSync.isUploading = true;
        try {
            // We stringify first to ensure no undefined values or non-serializable objects break Firestore
            const cleanState = JSON.parse(JSON.stringify(stateObj));
            
            // Optionally add a timestamp so we know when it was last updated
            cleanState.last_updated = new Date().toISOString();
            
            await setDoc(stateDocRef, cleanState);
            console.log("State successfully synced to Firestore!");
        } catch (error) {
            console.error("Error syncing state to Firestore:", error);
            // Don't show alert here to prevent annoying the user on every save, just log it.
        } finally {
            window.FirebaseSync.isUploading = false;
        }
    },
    
    // Listen for changes from Firestore (real-time sync)
    listenState: (callback) => {
        onSnapshot(stateDocRef, (docSnap) => {
            if (docSnap.exists()) {
                // If we are currently uploading, don't immediately override local state to prevent UI jumping
                if (window.FirebaseSync.isUploading) return;
                
                console.log("Received new state from Firestore!");
                const data = docSnap.data();
                callback(data);
            } else {
                console.log("No data found in Firestore yet. Pushing local state to initialize cloud database.");
                if (window.state && window.FirebaseSync.pushState) {
                    window.FirebaseSync.pushState(window.state);
                }
            }
        }, (error) => {
            console.error("Error listening to Firestore:", error);
        });
    }
};

// Automatically start listening to Firestore if window.syncStateFromCloud is defined
if (typeof window.syncStateFromCloud === 'function') {
    window.FirebaseSync.listenState(window.syncStateFromCloud);
}
