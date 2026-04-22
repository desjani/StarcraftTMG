// Firebase is loaded via CDN in index.html. This file only initializes it if needed.
// Keep compat auth on the same project/config namespace as cloudSync.js so auth
// state, currentUser, and ID tokens stay aligned across the app.
function getFirebaseAuthDomain(hostname = '') {
  const normalized = String(hostname || '').trim().toLowerCase();
  if (normalized === 'scadjutant.com' || normalized === 'www.scadjutant.com') {
    return normalized;
  }
  return 'starcrafttmg-dc616.firebaseapp.com';
}

const firebaseConfig = {
  apiKey: "AIzaSyDEAYGa0_BaLwIKIDFA37WEsBw6_Pf_1v4",
  authDomain: getFirebaseAuthDomain(typeof window !== 'undefined' ? window.location.hostname : ''),
  projectId: "starcrafttmg-dc616",
  storageBucket: "starcrafttmg-dc616.firebasestorage.app",
  messagingSenderId: "561160921740",
  appId: "1:561160921740:web:2b9425e53cd0f6928451a9",
  measurementId: "G-6165SBS0VS",
};

if (!window.firebase.apps.length) {
  window.firebase.initializeApp(firebaseConfig);
}

export default window.firebase;
