import { auth, db, storage } from './firebase.js';
import { 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject 
} from 'firebase/storage';
import { 
    doc, 
    updateDoc, 
    arrayUnion, 
    arrayRemove 
} from 'firebase/firestore';

export class PhotoGallery {
    constructor(containerId, listingId) {
        this.container = document.getElementById(containerId);
        this.listingId = listingId;
        this.maxImages = 10;
        this.acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.cropperInstance = null;
        
        this.init();
    }

    init() {
        this.createGalleryStructure();
        this.setupDragAndDrop();
        this.setupImageCropper();
    }

    createGalleryStructure() {
        this.container.innerHTML = `
            <div class="mb-4">
                <h3 class="text-lg font-semibold mb-2">Photo Gallery</h3>
                <p class="text-sm text-gray-600 mb-2">Drag & drop images or click to upload (max ${this.maxImages} images)</p>
                <div id="dropZone" class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#FFA500] transition-colors">
                    <div class="flex flex-col items-center">
                        <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <p class="text-gray-600">Drop images here or click to select</p>
                    </div>
                    <input type="file" id="fileInput" multiple accept="image/*" class="hidden">
                </div>
            </div>
            <div id="imagePreview" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4"></div>
            
            <!-- Cropper Modal -->
            <div id="cropperModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
                <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold">Crop Image</h3>
                        <button id="closeCropperBtn" class="text-gray-500 hover:text-gray-700">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    <div class="mb-4 overflow-auto" style="max-height: 60vh;">
                        <img id="cropperImage" class="max-w-full">
                    </div>
                    <div class="flex justify-end gap-2">
                        <button id="cancelCropBtn" class="px-4 py-2 border rounded-lg hover:bg-gray-100">
                            Cancel
                        </button>
                        <button id="applyCropBtn" class="px-4 py-2 bg-[#1F3A93] text-white rounded-lg hover:bg-[#FFA500]">
                            Apply Crop
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Get DOM elements
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.imagePreview = document.getElementById('imagePreview');
        this.cropperModal = document.getElementById('cropperModal');
        this.cropperImage = document.getElementById('cropperImage');
        this.closeCropperBtn = document.getElementById('closeCropperBtn');
        this.cancelCropBtn = document.getElementById('cancelCropBtn');
        this.applyCropBtn = document.getElementById('applyCropBtn');
    }

    setupDragAndDrop() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.add('border-[#FFA500]', 'bg-orange-50');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.remove('border-[#FFA500]', 'bg-orange-50');
            });
        });

        this.dropZone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });

        this.dropZone.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFiles(files);
        });
    }

    setupImageCropper() {
        // Initialize Cropper.js when needed
        this.closeCropperBtn.addEventListener('click', () => this.closeCropper());
        this.cancelCropBtn.addEventListener('click', () => this.closeCropper());
        this.applyCropBtn.addEventListener('click', () => this.applyCrop());
    }

    async handleFiles(files) {
        const currentImages = this.imagePreview.querySelectorAll('.image-container').length;
        const remainingSlots = this.maxImages - currentImages;
        
        if (remainingSlots <= 0) {
            this.showNotification('Maximum number of images reached', 'error');
            return;
        }

        const validFiles = files.slice(0, remainingSlots).filter(file => {
            if (!this.acceptedTypes.includes(file.type)) {
                this.showNotification(`Invalid file type: ${file.type}`, 'error');
                return false;
            }
            if (file.size > this.maxFileSize) {
                this.showNotification('File too large (max 5MB)', 'error');
                return false;
            }
            return true;
        });

        for (const file of validFiles) {
            await this.processFile(file);
        }
    }

    async processFile(file) {
        // Create temporary preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.openCropper(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    openCropper(imageSrc) {
        this.cropperModal.classList.remove('hidden');
        this.cropperImage.src = imageSrc;
        
        // Initialize Cropper.js
        if (this.cropperInstance) {
            this.cropperInstance.destroy();
        }
        
        this.cropperInstance = new Cropper(this.cropperImage, {
            aspectRatio: 16 / 9,
            viewMode: 2,
            autoCropArea: 1,
            responsive: true,
            restore: false
        });
    }

    closeCropper() {
        if (this.cropperInstance) {
            this.cropperInstance.destroy();
            this.cropperInstance = null;
        }
        this.cropperModal.classList.add('hidden');
    }

    async applyCrop() {
        if (!this.cropperInstance) return;

        try {
            // Get cropped canvas
            const canvas = this.cropperInstance.getCroppedCanvas({
                maxWidth: 1920,
                maxHeight: 1080,
                fillColor: '#fff'
            });

            // Convert to blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
            
            // Upload to Firebase Storage
            const fileName = `listings/${this.listingId}/images/${Date.now()}.jpg`;
            const storageRef = ref(storage, fileName);
            await uploadBytes(storageRef, blob);
            const imageUrl = await getDownloadURL(storageRef);

            // Update Firestore document
            const listingRef = doc(db, 'parking', this.listingId);
            await updateDoc(listingRef, {
                images: arrayUnion(imageUrl)
            });

            // Add to preview
            this.addImagePreview(imageUrl, fileName);
            
            // Close cropper
            this.closeCropper();
            this.showNotification('Image uploaded successfully', 'success');
        } catch (error) {
            console.error('Error uploading image:', error);
            this.showNotification('Error uploading image', 'error');
        }
    }

    addImagePreview(imageUrl, fileName) {
        const container = document.createElement('div');
        container.className = 'image-container relative group';
        container.innerHTML = `
            <img src="${imageUrl}" alt="Listing image" 
                 class="w-full h-48 object-cover rounded-lg shadow-md">
            <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 
                        transition-opacity flex items-center justify-center gap-2 rounded-lg">
                <button class="delete-btn p-2 bg-red-500 text-white rounded-full hover:bg-red-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
                <button class="feature-btn p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                </button>
            </div>
        `;

        // Add delete handler
        container.querySelector('.delete-btn').addEventListener('click', async () => {
            try {
                // Delete from Storage
                const storageRef = ref(storage, fileName);
                await deleteObject(storageRef);

                // Remove from Firestore
                const listingRef = doc(db, 'parking', this.listingId);
                await updateDoc(listingRef, {
                    images: arrayRemove(imageUrl)
                });

                // Remove preview
                container.remove();
                this.showNotification('Image deleted successfully', 'success');
            } catch (error) {
                console.error('Error deleting image:', error);
                this.showNotification('Error deleting image', 'error');
            }
        });

        // Add feature image handler
        container.querySelector('.feature-btn').addEventListener('click', async () => {
            try {
                const listingRef = doc(db, 'parking', this.listingId);
                await updateDoc(listingRef, {
                    featuredImage: imageUrl
                });
                this.showNotification('Featured image updated', 'success');
            } catch (error) {
                console.error('Error updating featured image:', error);
                this.showNotification('Error updating featured image', 'error');
            }
        });

        this.imagePreview.appendChild(container);
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const notificationArea = document.getElementById('notificationArea');
        if (notificationArea) {
            notificationArea.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);
        }
    }
} 