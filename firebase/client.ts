import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAnidIxgkbeoTptF7jhw3LowxtyaGqFAWI",
    authDomain: "sjfinalfirebase.firebaseapp.com",
    projectId: "sjfinalfirebase",
    storageBucket: "sjfinalfirebase.firebasestorage.app",
    messagingSenderId: "749422020104",
    appId: "1:749422020104:web:28d29e27a3f8551fd8b3bd",
    measurementId: "G-B2HRLB4EXC"
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);