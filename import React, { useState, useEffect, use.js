import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

// Define the school distances matrix from the provided PDF
const schoolDistances = {
  "Admin. Center": {
    "Admin. Center": 0, "Troxell Building": 2, "High School": 3, "Orefield": 3, "Springhouse": 1, "Cetronia": 3, "Fogelsville": 8, "Jaindl": 10, "Kernsville": 4, "Kratzer": 3, "Ironton": 7, "Parkway Manor": 1, "Schnecksville": 6, "Veterans Memorial": 8, "IU/LCTI/LCCC": 7
  },
  "Troxell Building": {
    "Admin. Center": 2, "Troxell Building": 0, "High School": 1, "Orefield": 4, "Springhouse": 2, "Cetronia": 4, "Fogelsville": 9, "Jaindl": 11, "Kernsville": 4, "Kratzer": 2, "Ironton": 4, "Parkway Manor": 3, "Schnecksville": 6, "Veterans Memorial": 10, "IU/LCTI/LCCC": 7
  },
  "High School": {
    "Admin. Center": 3, "Troxell Building": 1, "High School": 0, "Orefield": 3, "Springhouse": 3, "Cetronia": 4, "Fogelsville": 9, "Jaindl": 12, "Kernsville": 3, "Kratzer": 3, "Ironton": 3, "Parkway Manor": 4, "Schnecksville": 5, "Veterans Memorial": 9, "IU/LCTI/LCCC": 6
  },
  "Orefield": {
    "Admin. Center": 3, "Troxell Building": 4, "High School": 3, "Orefield": 0, "Springhouse": 3, "Cetronia": 4, "Fogelsville": 9, "Jaindl": 13, "Kernsville": 1, "Kratzer": 6, "Ironton": 8, "Parkway Manor": 4, "Schnecksville": 3, "Veterans Memorial": 9, "IU/LCTI/LCCC": 4
  },
  "Springhouse": {
    "Admin. Center": 1, "Troxell Building": 2, "High School": 3, "Orefield": 3, "Springhouse": 0, "Cetronia": 3, "Fogelsville": 8, "Jaindl": 10, "Kernsville": 4, "Kratzer": 3, "Ironton": 7, "Parkway Manor": 1, "Schnecksville": 6, "Veterans Memorial": 8, "IU/LCTI/LCCC": 7
  },
  "Cetronia": {
    "Admin. Center": 3, "Troxell Building": 4, "High School": 4, "Orefield": 4, "Springhouse": 3, "Cetronia": 0, "Fogelsville": 8, "Jaindl": 11, "Kernsville": 7, "Kratzer": 4, "Ironton": 9, "Parkway Manor": 2, "Schnecksville": 9, "Veterans Memorial": 8, "IU/LCTI/LCCC": 10
  },
  "Fogelsville": {
    "Admin. Center": 8, "Troxell Building": 9, "High School": 9, "Orefield": 9, "Springhouse": 8, "Cetronia": 8, "Fogelsville": 0, "Jaindl": 3, "Kernsville": 9, "Kratzer": 11, "Ironton": 13, "Parkway Manor": 7, "Schnecksville": 10, "Veterans Memorial": 2, "IU/LCTI/LCCC": 11
  },
  "Jaindl": {
    "Admin. Center": 10, "Troxell Building": 11, "High School": 12, "Orefield": 13, "Springhouse": 10, "Cetronia": 11, "Fogelsville": 3, "Jaindl": 0, "Kernsville": 11, "Kratzer": 12, "Ironton": 16, "Parkway Manor": 10, "Schnecksville": 13, "Veterans Memorial": 2, "IU/LCTI/LCCC": 14
  },
  "Kernsville": {
    "Admin. Center": 4, "Troxell Building": 4, "High School": 3, "Orefield": 1, "Springhouse": 4, "Cetronia": 7, "Fogelsville": 9, "Jaindl": 11, "Kernsville": 0, "Kratzer": 6, "Ironton": 5, "Parkway Manor": 5, "Schnecksville": 4, "Veterans Memorial": 9, "IU/LCTI/LCCC": 5
  },
  "Kratzer": {
    "Admin. Center": 3, "Troxell Building": 2, "High School": 3, "Orefield": 6, "Springhouse": 3, "Cetronia": 4, "Fogelsville": 11, "Jaindl": 12, "Kernsville": 6, "Kratzer": 0, "Ironton": 5, "Parkway Manor": 4, "Schnecksville": 9, "Veterans Memorial": 10, "IU/LCTI/LCCC": 10
  },
  "Ironton": {
    "Admin. Center": 7, "Troxell Building": 4, "High School": 3, "Orefield": 8, "Springhouse": 7, "Cetronia": 9, "Fogelsville": 13, "Jaindl": 16, "Kernsville": 5, "Kratzer": 5, "Ironton": 0, "Parkway Manor": 8, "Schnecksville": 4, "Veterans Memorial": 13, "IU/LCTI/LCCC": 5
  },
  "Parkway Manor": {
    "Admin. Center": 1, "Troxell Building": 3, "High School": 4, "Orefield": 4, "Springhouse": 1, "Cetronia": 2, "Fogelsville": 7, "Jaindl": 10, "Kernsville": 5, "Kratzer": 4, "Ironton": 8, "Parkway Manor": 0, "Schnecksville": 8, "Veterans Memorial": 8, "IU/LCTI/LCCC": 9
  },
  "Schnecksville": {
    "Admin. Center": 6, "Troxell Building": 6, "High School": 5, "Orefield": 3, "Springhouse": 6, "Cetronia": 9, "Fogelsville": 10, "Jaindl": 13, "Kernsville": 4, "Kratzer": 9, "Ironton": 4, "Parkway Manor": 8, "Schnecksville": 0, "Veterans Memorial": 12, "IU/LCTI/LCCC": 1
  },
  "Veterans Memorial": {
    "Admin. Center": 8, "Troxell Building": 10, "High School": 9, "Orefield": 9, "Springhouse": 8, "Cetronia": 8, "Fogelsville": 2, "Jaindl": 2, "Kernsville": 9, "Kratzer": 10, "Ironton": 13, "Parkway Manor": 8, "Schnecksville": 12, "Veterans Memorial": 0, "IU/LCTI/LCCC": 11
  },
  "IU/LCTI/LCCC": {
    "Admin. Center": 7, "Troxell Building": 7, "High School": 6, "Orefield": 4, "Springhouse": 7, "Cetronia": 10, "Fogelsville": 11, "Jaindl": 14, "Kernsville": 5, "Kratzer": 10, "Ironton": 5, "Parkway Manor": 9, "Schnecksville": 1, "Veterans Memorial": 11, "IU/LCTI/LCCC": 0
  }
};

// Combine all possible destinations (now only from schoolDistances)
const allDestinations = Object.keys(schoolDistances).sort(); // Sort alphabetically for better display

function App() {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [travelEntries, setTravelEntries] = useState([]);
  const [currentDate, setCurrentDate] = useState('');
  const [startLocation, setStartLocation] = useState(allDestinations[0]);
  const [endLocation, setEndLocation] = useState(allDestinations[0]);
  const [odometerReading, setOdometerReading] = useState('');
  const [message, setMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Firebase configuration and initialization
  useEffect(() => {
    // Ensure __app_id and __firebase_config are defined in the environment
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const firebaseAuth = getAuth(app);

      setDb(firestore);
      setAuth(firebaseAuth);

      // Sign in anonymously or with custom token
      const signInUser = async () => {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(firebaseAuth, __initial_auth_token);
            console.log("Signed in with custom token.");
          } else {
            await signInAnonymously(firebaseAuth);
            console.log("Signed in anonymously.");
          }
        } catch (error) {
          console.error("Firebase authentication error:", error);
          setMessage(`Authentication error: ${error.message}`);
        }
      };

      // Listen for auth state changes
      const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
        if (user) {
          setUserId(user.uid);
          console.log("User ID set:", user.uid);
        } else {
          setUserId(null);
          console.log("No user signed in.");
          signInUser(); // Try to sign in if no user is found
        }
      });

      // Set initial date to today
      const today = new Date();
      setCurrentDate(today.toISOString().split('T')[0]);

      return () => unsubscribeAuth();
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
      setMessage(`Firebase initialization error: ${error.message}`);
    }
  }, []);

  // Fetch travel entries when db and userId are available
  useEffect(() => {
    if (db && userId) {
      const travelLogCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/travelLog`);
      // Order by timestamp to ensure correct calculation order
      const q = query(travelLogCollectionRef, orderBy("timestamp", "asc"));

      const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTravelEntries(entries);
        console.log("Travel entries updated:", entries);
      }, (error) => {
        console.error("Error fetching travel entries:", error);
        setMessage(`Error fetching data: ${error.message}`);
      });

      return () => unsubscribeSnapshot();
    }
  }, [db, userId]);

  const calculateMiles = (entries) => {
    let calculatedEntries = [];
    let cumulativeMiles = 0;

    entries.forEach((entry, index) => {
      let dailyMiles = 0;
      let tripMiles = 0; // New variable for destination-to-destination miles

      // Calculate daily miles based on odometer difference
      if (index > 0) {
        const prevEntry = entries[index - 1];
        dailyMiles = entry.odometerReading - prevEntry.odometerReading;
      } else {
        dailyMiles = 0;
      }

      // Calculate trip miles based on predefined school distances
      if (schoolDistances[entry.startLocation] && schoolDistances[entry.startLocation][entry.endLocation] !== undefined) {
        tripMiles = schoolDistances[entry.startLocation][entry.endLocation];
      } else {
        tripMiles = 'N/A'; // Or 0, or indicate that distance is not available
      }

      cumulativeMiles += dailyMiles;

      calculatedEntries.push({
        ...entry,
        dailyMiles: parseFloat(dailyMiles.toFixed(2)),
        cumulativeMiles: parseFloat(cumulativeMiles.toFixed(2)),
        tripMiles: typeof tripMiles === 'number' ? parseFloat(tripMiles.toFixed(2)) : tripMiles // Add tripMiles
      });
    });
    return calculatedEntries;
  };

  const handleAddEntry = async () => {
    if (!db || !userId) {
      setMessage("Firebase not initialized or user not authenticated.");
      return;
    }
    if (!currentDate || !odometerReading) {
      setMessage("Please fill in Date and Odometer Reading.");
      return;
    }
    if (isNaN(parseFloat(odometerReading))) {
      setMessage("Odometer Reading must be a number.");
      return;
    }
    if (travelEntries.length > 0 && parseFloat(odometerReading) < travelEntries[travelEntries.length - 1].odometerReading) {
      setMessage("New odometer reading cannot be less than the previous one.");
      return;
    }

    const newEntry = {
      date: currentDate,
      startLocation: startLocation,
      endLocation: endLocation,
      odometerReading: parseFloat(odometerReading),
      timestamp: Date.now() // Use timestamp for reliable sorting
    };

    try {
      const docRef = await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/travelLog`), newEntry);
      setMessage("Entry added successfully!");
      // Clear form fields
      setOdometerReading('');
      // Keep current date for convenience, or reset: setCurrentDate(new Date().toISOString().split('T')[0]);
    } catch (e) {
      console.error("Error adding document: ", e);
      setMessage(`Error adding entry: ${e.message}`);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!db || !userId) {
      setMessage("Firebase not initialized or user not authenticated.");
      return;
    }
    try {
      await deleteDoc(doc(db, `artifacts/${__app_id}/users/${userId}/travelLog`, id));
      setMessage("Entry deleted successfully!");
    } catch (e) {
      console.error("Error deleting document: ", e);
      setMessage(`Error deleting entry: ${e.message}`);
    }
  };

  const confirmDelete = (id) => {
    setItemToDelete(id);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      handleDeleteEntry(itemToDelete);
      setItemToDelete(null);
    }
    setShowConfirmModal(false);
  };

  const handleCancelDelete = () => {
    setItemToDelete(null);
    setShowConfirmModal(false);
  };

  const displayedEntries = calculateMiles(travelEntries);

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans flex flex-col items-center">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-4 text-center">Travel Log</h1>
        {userId && (
          <p className="text-sm text-gray-600 mb-4 text-center">Your User ID: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{userId}</span></p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              id="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="startLocation" className="block text-sm font-medium text-gray-700 mb-1">Start Location</label>
            <select
              id="startLocation"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {allDestinations.map((dest, index) => (
                <option key={index} value={dest}>{dest}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="endLocation" className="block text-sm font-medium text-gray-700 mb-1">End Location</label>
            <select
              id="endLocation"
              value={endLocation}
              onChange={(e) => setEndLocation(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {allDestinations.map((dest, index) => (
                <option key={index} value={dest}>{dest}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="odometerReading" className="block text-sm font-medium text-gray-700 mb-1">Odometer Reading (miles)</label>
            <input
              type="number"
              id="odometerReading"
              value={odometerReading}
              onChange={(e) => setOdometerReading(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g., 12345.6"
            />
          </div>
        </div>

        <button
          onClick={handleAddEntry}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105"
        >
          Add Travel Entry
        </button>

        {message && (
          <p className="mt-4 text-center text-sm font-medium text-red-600">{message}</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Travel Log Entries</h2>
        {displayedEntries.length === 0 ? (
          <p className="text-center text-gray-600">No entries yet. Add your first travel entry above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Location</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Location</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Odometer (miles)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Miles</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trip Miles</th> {/* New column */}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cumulative Miles</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                </tr>
              </thead><tbody className="bg-white divide-y divide-gray-200">
                {displayedEntries.map((entry, index) => (
                  <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.startLocation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.endLocation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.odometerReading}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.dailyMiles}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.tripMiles}</td> {/* Display tripMiles */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.cumulativeMiles}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => confirmDelete(entry.id)}
                        className="text-red-600 hover:text-red-900 ml-4 p-2 rounded-md hover:bg-red-100 transition duration-150 ease-in-out"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this entry? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-150 ease-in-out"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150 ease-in-out"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
