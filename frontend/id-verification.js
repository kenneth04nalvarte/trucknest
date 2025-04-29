import { storage, db } from './firebase.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

export class IDVerification {
    constructor(containerId, userId) {
        this.container = document.getElementById(containerId);
        this.userId = userId;
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        this.init();
    }

    init() {
        this.createVerificationForm();
        this.setupEventListeners();
    }

    createVerificationForm() {
        this.container.innerHTML = `
            <div class="space-y-4">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold mb-2">ID Verification</h3>
                    <p class="text-sm text-gray-600 mb-4">Please upload a clear photo of your commercial driver's license (CDL)</p>
                    
                    <div id="idDropZone" class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#FFA500] transition-colors">
                        <div class="flex flex-col items-center">
                            <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            <p class="text-gray-600">Drop your ID photo here or click to select</p>
                            <p class="text-sm text-gray-500 mt-2">Supported formats: JPEG, PNG, WEBP (max 5MB)</p>
                        </div>
                        <input type="file" id="idFileInput" accept="image/*" class="hidden">
                    </div>
                    <div id="idPreview" class="mt-4 hidden">
                        <img id="idPreviewImage" class="max-w-full h-auto rounded-lg shadow-md">
                        <button id="removeIdPhoto" class="mt-2 text-red-500 hover:text-red-700">Remove Photo</button>
                    </div>
                </div>

                <div class="mb-4">
                    <label class="block text-gray-700 font-semibold mb-2" for="idExpirationDate">
                        ID Expiration Date
                        <span class="text-red-500">*</span>
                    </label>
                    <input type="date" id="idExpirationDate" 
                           class="w-full px-4 py-2 rounded border border-gray-300"
                           required>
                    <p class="text-sm text-gray-500 mt-1">You'll be notified 30 days before expiration</p>
                </div>

                <div id="verificationStatus" class="hidden rounded-lg p-4 mb-4"></div>
            </div>
        `;
    }

    setupEventListeners() {
        const dropZone = document.getElementById('idDropZone');
        const fileInput = document.getElementById('idFileInput');
        const preview = document.getElementById('idPreview');
        const previewImage = document.getElementById('idPreviewImage');
        const removeButton = document.getElementById('removeIdPhoto');
        const expirationInput = document.getElementById('idExpirationDate');

        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        expirationInput.min = today;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('border-[#FFA500]', 'bg-orange-50');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('border-[#FFA500]', 'bg-orange-50');
            });
        });

        dropZone.addEventListener('drop', (e) => {
            const file = e.dataTransfer.files[0];
            this.handleFile(file);
        });

        dropZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            this.handleFile(file);
        });

        removeButton.addEventListener('click', () => {
            preview.classList.add('hidden');
            dropZone.classList.remove('hidden');
            this.idFile = null;
            previewImage.src = '';
        });
    }

    async handleFile(file) {
        if (!file) return;

        if (!this.acceptedTypes.includes(file.type)) {
            this.showStatus('Invalid file type. Please upload a JPEG, PNG, or WEBP image.', 'error');
            return;
        }

        if (file.size > this.maxFileSize) {
            this.showStatus('File too large. Maximum size is 5MB.', 'error');
            return;
        }

        this.idFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('idPreview');
            const previewImage = document.getElementById('idPreviewImage');
            const dropZone = document.getElementById('idDropZone');

            previewImage.src = e.target.result;
            preview.classList.remove('hidden');
            dropZone.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }

    showStatus(message, type) {
        const status = document.getElementById('verificationStatus');
        status.textContent = message;
        status.className = `rounded-lg p-4 mb-4 ${
            type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`;
        status.classList.remove('hidden');
        setTimeout(() => status.classList.add('hidden'), 5000);
    }

    async submitVerification() {
        const expirationDate = document.getElementById('idExpirationDate').value;

        if (!this.idFile || !expirationDate) {
            this.showStatus('Please upload an ID photo and set the expiration date.', 'error');
            return false;
        }

        try {
            // Upload ID photo
            const fileName = `users/${this.userId}/id_verification/${Date.now()}_id.jpg`;
            const storageRef = ref(storage, fileName);
            await uploadBytes(storageRef, this.idFile);
            const idPhotoUrl = await getDownloadURL(storageRef);

            // Update user document with verification info
            const userRef = doc(db, 'users', this.userId);
            await updateDoc(userRef, {
                idVerification: {
                    photoUrl: idPhotoUrl,
                    expirationDate: expirationDate,
                    verifiedAt: new Date().toISOString(),
                    status: 'pending'
                }
            });

            this.showStatus('ID verification submitted successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Error submitting verification:', error);
            this.showStatus('Error submitting verification. Please try again.', 'error');
            return false;
        }
    }
} 