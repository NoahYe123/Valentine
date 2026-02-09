// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCZvWlTL4ihuBt-0up-cmh8zC7wnl3vL8k",
    authDomain: "valentine-2a721.firebaseapp.com",
    projectId: "valentine-2a721",
    storageBucket: "valentine-2a721.firebasestorage.app",
    messagingSenderId: "434251420880",
    appId: "1:434251420880:web:d9bd4f4fa4e1a1650f7ad5",
    measurementId: "G-0NF1H7KV00"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// ✅ Workaround for networks/VPNs that break Firestore streaming (common)
firebase.firestore().settings({
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

const storage = firebase.storage();
const db = firebase.firestore();

// Debug: Check if Firebase initialized correctly
console.log('Firebase initialized with long polling');
console.log('Storage:', storage);
console.log('Firestore:', db);

// DOM Elements
const photoInput = document.getElementById('photoInput');
const photoPreview = document.getElementById('photoPreview');
const acceptBtn = document.getElementById('acceptBtn');
const declineBtn = document.getElementById('declineBtn');
const linkContainer = document.getElementById('linkContainer');
const uniqueLink = document.getElementById('uniqueLink');
const copyBtn = document.getElementById('copyBtn');

// Check if there's a photo ID in the URL
const urlParams = new URLSearchParams(window.location.search);
const photoId = urlParams.get('id');

if (photoId) {
    // Load existing photo from Firebase
    loadPhotoFromFirebase(photoId);
} else {
    // Allow user to upload a new photo
    setupPhotoUpload();
}

function setupPhotoUpload() {
    photoInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            // Show loading state
            photoPreview.innerHTML = '<div class="loading">Uploading... ⏳</div>';
            console.log('Starting upload process...');

            try {
                // Upload to Firebase Storage
                const timestamp = Date.now();
                const fileName = `valentine-photos/${timestamp}_${file.name}`;
                const storageRef = storage.ref(fileName);

                console.log('Uploading to Storage...');
                await storageRef.put(file);
                console.log('Storage upload complete!');

                const photoURL = await storageRef.getDownloadURL();
                console.log('Got download URL:', photoURL);

                // Save to Firestore
                console.log('Saving to Firestore...');
                console.log('Firestore db object:', db);
                console.log('Collection name: valentine2');

                try {
                    // Create a promise with timeout
                    const savePromise = db.collection('valentine2').add({
                        photoURL: photoURL,
                        createdAt: new Date().toISOString()
                    });

                    console.log('Firestore write initiated, waiting for response...');

                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Firestore write timed out after 15 seconds')), 15000);
                    });

                    const docRef = await Promise.race([savePromise, timeoutPromise]);
                    console.log('✅ Firestore save complete! Doc ID:', docRef.id);
                } catch (firestoreError) {
                    console.error('❌ Firestore write failed:', firestoreError);
                    console.error('Error code:', firestoreError.code);
                    console.error('Error message:', firestoreError.message);
                    console.error('Full error:', firestoreError);
                    throw firestoreError;
                }

                // Display the photo
                displayPhoto(photoURL);
                console.log('Photo displayed');

                // Generate and show the unique link
                const baseURL = window.location.origin + window.location.pathname;
                const shareableLink = `${baseURL}?id=${docRef.id}`;
                uniqueLink.value = shareableLink;
                linkContainer.style.display = 'block';
                console.log('Link generated:', shareableLink);

            } catch (error) {
                console.error('Error uploading photo:', error);
                console.error('Error details:', error.code, error.message);
                photoPreview.innerHTML = `
                    <label for="photoInput" class="upload-label">
                        <span>❌ Upload failed. Try again.</span>
                    </label>
                `;
                alert('Failed to upload photo. Error: ' + error.message);
            }
        }
    });
}

async function loadPhotoFromFirebase(id) {
    try {
        const doc = await db.collection('valentine2').doc(id).get();

        if (doc.exists) {
            const data = doc.data();
            displayPhoto(data.photoURL);
        } else {
            photoPreview.innerHTML = '<div class="error">Photo not found 😢</div>';
        }
    } catch (error) {
        console.error('Error loading photo:', error);
        photoPreview.innerHTML = '<div class="error">Error loading photo</div>';
    }
}

function displayPhoto(photoURL) {
    photoPreview.innerHTML = `<img src="${photoURL}" alt="Valentine photo">`;

    // Allow clicking to change photo only if no ID in URL
    if (!photoId) {
        const img = photoPreview.querySelector('img');
        img.addEventListener('click', function() {
            photoInput.click();
        });
        img.style.cursor = 'pointer';
        img.title = 'Click to change photo';
    }
}

// Copy link button
copyBtn.addEventListener('click', function() {
    uniqueLink.select();
    document.execCommand('copy');
    copyBtn.textContent = 'Copied! ✓';
    setTimeout(() => {
        copyBtn.textContent = 'Copy';
    }, 2000);
});

// Decline button animation (runs away)
declineBtn.addEventListener('mouseover', function() {
    const container = document.querySelector('.container');
    const containerRect = container.getBoundingClientRect();
    const btnRect = declineBtn.getBoundingClientRect();

    const maxX = containerRect.width - btnRect.width - 40;
    const maxY = containerRect.height - btnRect.height - 40;

    const randomX = Math.random() * maxX;
    const randomY = Math.random() * maxY;

    declineBtn.style.position = 'absolute';
    declineBtn.style.left = randomX + 'px';
    declineBtn.style.top = randomY + 'px';
    declineBtn.style.transform = 'none';
});

// Accept button
acceptBtn.addEventListener('click', function() {
    const hearts = ['💕', '💖', '💗', '💝', '💘', '❤️', '💓'];
    const randomHearts = hearts[Math.floor(Math.random() * hearts.length)];

    document.querySelector('.container').innerHTML = `
        <h1 style="font-size: 3em; color: #ff6b9d;">Yay! ${randomHearts}</h1>
        <p style="font-size: 1.5em; color: #c06c84; margin-top: 20px;">
            I knew you'd say yes!
        </p>
    `;
});
