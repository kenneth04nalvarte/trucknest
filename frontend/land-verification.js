import { storage, db } from './firebase.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

export class LandVerification {
    constructor(containerId, userId, isBusinessAccount) {
        this.container = document.getElementById(containerId);
        this.userId = userId;
        this.isBusinessAccount = isBusinessAccount;
        this.maxFileSize = 50 * 1024 * 1024; // 50MB for videos
        this.maxImageSize = 10 * 1024 * 1024; // 10MB for images
        this.acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
        this.acceptedVideoTypes = ['video/mp4', 'video/webm'];
        this.acceptedDocTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        this.uploadedFiles = {
            photos: [],
            video: null,
            utilityBill: null,
            mortgageStatement: null,
            businessDocs: []
        };
        this.init();
    }

    init() {
        this.createVerificationForm();
        this.setupEventListeners();
    }

    createVerificationForm() {
        this.container.innerHTML = `
            <div class="space-y-6">
                <div class="mb-6">
                    <h3 class="text-xl font-semibold mb-2">Land Ownership Verification</h3>
                    <p class="text-sm text-gray-600">Please provide the required documentation to verify your land ownership.</p>
                </div>

                <!-- Photo Upload Section -->
                <div class="mb-6">
                    <h4 class="font-semibold mb-2">Property Photos</h4>
                    <p class="text-sm text-gray-600 mb-2">Upload clear photos of your property (max 5 photos, 10MB each)</p>
                    <div id="photoDropZone" class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                        <input type="file" id="photoInput" accept="image/*" multiple class="hidden">
                        <div class="flex flex-col items-center">
                            <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            <p>Drop photos here or click to select</p>
                        </div>
                    </div>
                    <div id="photoPreview" class="grid grid-cols-3 gap-4 mt-4"></div>
                </div>

                <!-- Video Upload Section -->
                <div class="mb-6">
                    <h4 class="font-semibold mb-2">Property Video</h4>
                    <p class="text-sm text-gray-600 mb-2">Upload a video walkthrough of your property (max 50MB)</p>
                    <div id="videoDropZone" class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                        <input type="file" id="videoInput" accept="video/*" class="hidden">
                        <div class="flex flex-col items-center">
                            <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                            </svg>
                            <p>Drop video here or click to select</p>
                        </div>
                    </div>
                    <div id="videoPreview" class="mt-4 hidden"></div>
                </div>

                <!-- Utility Bill Section -->
                <div class="mb-6">
                    <h4 class="font-semibold mb-2">Utility Bill</h4>
                    <p class="text-sm text-gray-600 mb-2">Upload a recent utility bill (not older than 3 months)</p>
                    <div id="utilityDropZone" class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                        <input type="file" id="utilityInput" accept=".pdf,image/*" class="hidden">
                        <div class="flex flex-col items-center">
                            <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            <p>Drop utility bill here or click to select</p>
                        </div>
                    </div>
                    <div id="utilityPreview" class="mt-4 hidden"></div>
                </div>

                <!-- Mortgage Statement Section -->
                <div class="mb-6">
                    <h4 class="font-semibold mb-2">Mortgage Statement or Property Deed</h4>
                    <p class="text-sm text-gray-600 mb-2">Upload your most recent mortgage statement or property deed</p>
                    <div id="mortgageDropZone" class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                        <input type="file" id="mortgageInput" accept=".pdf,image/*" class="hidden">
                        <div class="flex flex-col items-center">
                            <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            <p>Drop mortgage statement here or click to select</p>
                        </div>
                    </div>
                    <div id="mortgagePreview" class="mt-4 hidden"></div>
                </div>

                ${this.isBusinessAccount ? `
                <!-- Business Documents Section -->
                <div class="mb-6">
                    <h4 class="font-semibold mb-2">Business Documents</h4>
                    <p class="text-sm text-gray-600 mb-2">Upload relevant business documentation (LLC certificate, articles of incorporation, etc.)</p>
                    <div id="businessDocsDropZone" class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                        <input type="file" id="businessDocsInput" accept=".pdf,image/*" multiple class="hidden">
                        <div class="flex flex-col items-center">
                            <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            <p>Drop business documents here or click to select</p>
                        </div>
                    </div>
                    <div id="businessDocsPreview" class="mt-4 hidden"></div>
                </div>
                ` : ''}

                <div id="verificationStatus" class="hidden rounded-lg p-4 mb-4"></div>
            </div>
        `;
    }

    setupEventListeners() {
        const dropZones = ['photo', 'video', 'utility', 'mortgage'];
        if (this.isBusinessAccount) dropZones.push('businessDocs');

        dropZones.forEach(type => {
            const dropZone = document.getElementById(`${type}DropZone`);
            const input = document.getElementById(`${type}Input`);

            this.setupDropZoneListeners(dropZone, input, type);
        });
    }

    setupDropZoneListeners(dropZone, input, type) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('border-blue-500', 'bg-blue-50');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('border-blue-500', 'bg-blue-50');
            });
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFiles(files, type);
        });

        dropZone.addEventListener('click', () => input.click());

        input.addEventListener('change', (e) => {
            this.handleFiles(e.target.files, type);
        });
    }

    async handleFiles(files, type) {
        const preview = document.getElementById(`${type}Preview`);
        
        switch(type) {
            case 'photo':
                this.handlePhotos(Array.from(files), preview);
                break;
            case 'video':
                this.handleVideo(files[0], preview);
                break;
            case 'utility':
            case 'mortgage':
                this.handleDocument(files[0], type, preview);
                break;
            case 'businessDocs':
                this.handleBusinessDocs(Array.from(files), preview);
                break;
        }
    }

    handlePhotos(files, preview) {
        if (this.uploadedFiles.photos.length + files.length > 5) {
            this.showStatus('Maximum 5 photos allowed', 'error');
            return;
        }

        files.forEach(file => {
            if (!this.validateFile(file, 'image', this.maxImageSize)) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'relative';
                div.innerHTML = `
                    <img src="${e.target.result}" class="w-full h-32 object-cover rounded-lg">
                    <button class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                `;
                preview.appendChild(div);
                this.uploadedFiles.photos.push(file);

                div.querySelector('button').addEventListener('click', () => {
                    div.remove();
                    this.uploadedFiles.photos = this.uploadedFiles.photos.filter(f => f !== file);
                });
            };
            reader.readAsDataURL(file);
        });
    }

    handleVideo(file, preview) {
        if (!this.validateFile(file, 'video', this.maxFileSize)) return;

        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.controls = true;
        video.className = 'w-full rounded-lg';
        
        preview.innerHTML = '';
        preview.appendChild(video);
        preview.classList.remove('hidden');
        
        this.uploadedFiles.video = file;
    }

    handleDocument(file, type, preview) {
        if (!this.validateFile(file, 'document', this.maxImageSize)) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span class="text-sm font-medium">${file.name}</span>
                    <button class="text-red-500 hover:text-red-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            `;
            preview.classList.remove('hidden');
            
            this.uploadedFiles[type === 'utility' ? 'utilityBill' : 'mortgageStatement'] = file;

            preview.querySelector('button').addEventListener('click', () => {
                preview.innerHTML = '';
                preview.classList.add('hidden');
                this.uploadedFiles[type === 'utility' ? 'utilityBill' : 'mortgageStatement'] = null;
            });
        };
        reader.readAsDataURL(file);
    }

    handleBusinessDocs(files, preview) {
        files.forEach(file => {
            if (!this.validateFile(file, 'document', this.maxImageSize)) return;

            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-2';
            div.innerHTML = `
                <span class="text-sm font-medium">${file.name}</span>
                <button class="text-red-500 hover:text-red-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            `;
            preview.appendChild(div);
            this.uploadedFiles.businessDocs.push(file);

            div.querySelector('button').addEventListener('click', () => {
                div.remove();
                this.uploadedFiles.businessDocs = this.uploadedFiles.businessDocs.filter(f => f !== file);
            });
        });
        preview.classList.remove('hidden');
    }

    validateFile(file, type, maxSize) {
        if (type === 'image' && !this.acceptedImageTypes.includes(file.type)) {
            this.showStatus('Invalid image type. Please upload JPEG, PNG, or WEBP.', 'error');
            return false;
        }
        if (type === 'video' && !this.acceptedVideoTypes.includes(file.type)) {
            this.showStatus('Invalid video type. Please upload MP4 or WEBM.', 'error');
            return false;
        }
        if (type === 'document' && !this.acceptedDocTypes.includes(file.type)) {
            this.showStatus('Invalid document type. Please upload PDF or images.', 'error');
            return false;
        }
        if (file.size > maxSize) {
            this.showStatus(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`, 'error');
            return false;
        }
        return true;
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
        if (!this.validateSubmission()) {
            return false;
        }

        try {
            const uploadPromises = [];
            const fileUrls = {};

            // Upload photos
            for (const photo of this.uploadedFiles.photos) {
                const fileName = `users/${this.userId}/land_verification/photos/${Date.now()}_${photo.name}`;
                uploadPromises.push(this.uploadFile(photo, fileName, 'photos'));
            }

            // Upload video
            if (this.uploadedFiles.video) {
                const fileName = `users/${this.userId}/land_verification/video/${Date.now()}_${this.uploadedFiles.video.name}`;
                uploadPromises.push(this.uploadFile(this.uploadedFiles.video, fileName, 'video'));
            }

            // Upload utility bill
            if (this.uploadedFiles.utilityBill) {
                const fileName = `users/${this.userId}/land_verification/utility/${Date.now()}_${this.uploadedFiles.utilityBill.name}`;
                uploadPromises.push(this.uploadFile(this.uploadedFiles.utilityBill, fileName, 'utilityBill'));
            }

            // Upload mortgage statement
            if (this.uploadedFiles.mortgageStatement) {
                const fileName = `users/${this.userId}/land_verification/mortgage/${Date.now()}_${this.uploadedFiles.mortgageStatement.name}`;
                uploadPromises.push(this.uploadFile(this.uploadedFiles.mortgageStatement, fileName, 'mortgageStatement'));
            }

            // Upload business docs
            if (this.isBusinessAccount) {
                for (const doc of this.uploadedFiles.businessDocs) {
                    const fileName = `users/${this.userId}/land_verification/business_docs/${Date.now()}_${doc.name}`;
                    uploadPromises.push(this.uploadFile(doc, fileName, 'businessDocs'));
                }
            }

            const results = await Promise.all(uploadPromises);
            results.forEach(({ url, type }) => {
                if (type === 'photos') {
                    if (!fileUrls.photos) fileUrls.photos = [];
                    fileUrls.photos.push(url);
                } else if (type === 'businessDocs') {
                    if (!fileUrls.businessDocs) fileUrls.businessDocs = [];
                    fileUrls.businessDocs.push(url);
                } else {
                    fileUrls[type] = url;
                }
            });

            // Update user document with verification info
            const userRef = doc(db, 'users', this.userId);
            await updateDoc(userRef, {
                landVerification: {
                    ...fileUrls,
                    submittedAt: new Date().toISOString(),
                    status: 'pending',
                    isBusinessAccount: this.isBusinessAccount
                }
            });

            this.showStatus('Land verification submitted successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Error submitting verification:', error);
            this.showStatus('Error submitting verification. Please try again.', 'error');
            return false;
        }
    }

    async uploadFile(file, fileName, type) {
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        return { url, type };
    }

    validateSubmission() {
        if (this.uploadedFiles.photos.length === 0) {
            this.showStatus('Please upload at least one photo of your property.', 'error');
            return false;
        }
        if (!this.uploadedFiles.video) {
            this.showStatus('Please upload a video of your property.', 'error');
            return false;
        }
        if (!this.uploadedFiles.utilityBill && !this.uploadedFiles.mortgageStatement) {
            this.showStatus('Please upload either a utility bill or mortgage statement.', 'error');
            return false;
        }
        if (this.isBusinessAccount && this.uploadedFiles.businessDocs.length === 0) {
            this.showStatus('Please upload required business documents.', 'error');
            return false;
        }
        return true;
    }
} 