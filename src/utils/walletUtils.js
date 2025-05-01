import { getWalletJWT } from '../firebase';

export const addToGoogleWallet = async (passData) => {
    try {
        // Get JWT token for Google Pay API for Passes
        const jwt = await getWalletJWT('google', passData);
        
        // Google Pay API for Passes configuration
        const config = {
            jwt,
            origin: window.location.origin,
            walletId: process.env.REACT_APP_GOOGLE_WALLET_ISSUER_ID
        };

        // Load Google Pay API for Passes
        if (!window.google) {
            const script = document.createElement('script');
            script.src = 'https://pay.google.com/gp/p/js/pay.js';
            document.head.appendChild(script);
            await new Promise(resolve => script.onload = resolve);
        }

        // Add pass to Google Wallet
        await window.google.pay.button.mount({
            ...config,
            container: 'temporary-button-container',
            callback: async (result) => {
                if (result.status === 'success') {
                    console.log('Pass added to Google Wallet');
                }
            }
        });

    } catch (error) {
        console.error('Error adding to Google Wallet:', error);
        throw error;
    }
};

export const addToAppleWallet = async (passData) => {
    try {
        // Get signed pass from backend
        const response = await fetch('/api/passes/apple', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(passData)
        });

        if (!response.ok) {
            throw new Error('Failed to generate Apple Wallet pass');
        }

        // Get the .pkpass file
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'TruckNestPass.pkpass';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error adding to Apple Wallet:', error);
        throw error;
    }
}; 