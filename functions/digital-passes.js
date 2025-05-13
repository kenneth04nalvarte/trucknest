const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleAuth } = require('google-auth-library');
const { PassKit } = require('passkit-generator');
const path = require('path');
const fs = require('fs');

// Initialize admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// Generate JWT for Google Wallet
exports.generateGoogleWalletJWT = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
        const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
        const classId = `${issuerId}.trucknest_parking_pass`;
        const objectId = `${classId}.${data.id}`;

        const credentials = require('../config/google-wallet-credentials.json');
        const auth = new GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
        });

        // Create pass object
        const genericObject = {
            id: objectId,
            classId: classId,
            genericType: 'GENERIC_TYPE_UNSPECIFIED',
            hexBackgroundColor: '#1a73e8',
            logo: {
                sourceUri: {
                    uri: 'https://your-domain.com/logo.png'
                }
            },
            cardTitle: {
                defaultValue: {
                    language: 'en',
                    value: 'TruckNest Parking Pass'
                }
            },
            subheader: {
                defaultValue: {
                    language: 'en',
                    value: data.locationName
                }
            },
            header: {
                defaultValue: {
                    language: 'en',
                    value: data.driverName
                }
            },
            barcode: {
                type: 'QR_CODE',
                value: data.qrCodeData
            },
            textModulesData: [
                {
                    header: 'Check-in',
                    body: new Date(data.startDate).toLocaleString()
                },
                {
                    header: 'Check-out',
                    body: new Date(data.endDate).toLocaleString()
                },
                {
                    header: 'Status',
                    body: data.bookingStatus
                }
            ]
        };

        // Sign JWT
        const claims = {
            iss: credentials.client_email,
            aud: 'google',
            origins: ['https://your-domain.com'],
            typ: 'savetowallet',
            payload: {
                genericObjects: [genericObject]
            }
        };

        const token = await auth.sign(claims);
        return { jwt: token };

    } catch (error) {
        console.error('Error generating Google Wallet JWT:', error);
        throw new functions.https.HttpsError('internal', 'Error generating pass');
    }
});

// Generate Apple Wallet pass
exports.generateAppleWalletPass = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
        const pass = await PassKit.from({
            model: path.resolve(__dirname, '../config/parking-pass.pass'),
            certificates: {
                wwdr: fs.readFileSync(path.resolve(__dirname, '../config/wwdr.pem')),
                signerCert: fs.readFileSync(path.resolve(__dirname, '../config/signerCert.pem')),
                signerKey: fs.readFileSync(path.resolve(__dirname, '../config/signerKey.pem')),
                signerKeyPassphrase: process.env.APPLE_PASS_PHRASE
            }
        }, {
            serialNumber: data.id,
            description: 'TruckNest Parking Pass',
            organizationName: 'TruckNest',
            teamIdentifier: process.env.APPLE_TEAM_ID,
            passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID,
            
            // Pass data
            generic: {
                primaryFields: [
                    {
                        key: 'location',
                        label: 'Location',
                        value: data.locationName
                    }
                ],
                secondaryFields: [
                    {
                        key: 'driver',
                        label: 'Driver',
                        value: data.driverName
                    },
                    {
                        key: 'status',
                        label: 'Status',
                        value: data.bookingStatus
                    }
                ],
                auxiliaryFields: [
                    {
                        key: 'checkin',
                        label: 'Check-in',
                        value: new Date(data.startDate).toLocaleString()
                    },
                    {
                        key: 'checkout',
                        label: 'Check-out',
                        value: new Date(data.endDate).toLocaleString()
                    }
                ],
                backFields: [
                    {
                        key: 'terms',
                        label: 'Terms & Conditions',
                        value: 'Present this pass upon arrival. Pass is non-transferable.'
                    }
                ]
            },
            
            // Barcode
            barcode: {
                message: data.qrCodeData,
                format: 'PKBarcodeFormatQR',
                messageEncoding: 'iso-8859-1'
            },
            
            // Colors
            backgroundColor: 'rgb(26, 115, 232)',
            foregroundColor: 'rgb(255, 255, 255)',
            labelColor: 'rgb(255, 255, 255)'
        });

        const buffer = await pass.generate();
        return buffer.toString('base64');

    } catch (error) {
        console.error('Error generating Apple Wallet pass:', error);
        throw new functions.https.HttpsError('internal', 'Error generating pass');
    }
}); 