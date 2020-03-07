import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

const config = require("../config/firebase.json");

// Initialize Firebase
firebase.initializeApp(config);

export const firestore = firebase.firestore();
