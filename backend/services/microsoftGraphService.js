const { Client } = require('@microsoft/microsoft-graph-client');
const { poolPromise } = require('../db');

class MicrosoftGraphService {
    constructor() {
        this.client = null;
    }

    /**
     * Initialize Graph client with access token
     * @param {string} accessToken - Valid Microsoft Graph access token
     */
    initializeClient(accessToken) {
        try {
            this.client = Client.init({
                authProvider: (done) => {
                    done(null, accessToken);
                }
            });
            console.log('📊 Microsoft Graph client initialized');
        } catch (error) {
            console.error('❌ Error initializing Graph client:', error);
            throw error;
        }
    }

    /**
     * Get comprehensive user profile data from Microsoft Graph
     * @param {string} accessToken - Valid access token
     * @param {string} userId - Optional user ID (uses 'me' if not provided)
     * @returns {Object} Comprehensive user profile data
     */
    async getUserProfile(accessToken, userId = 'me') {
        try {
            this.initializeClient(accessToken);
            
            console.log('🔍 Fetching user profile from Microsoft Graph...');
            
            // Fetch basic user profile
            const userProfile = await this.client
                .api(`/${userId}`)
                .select([
                    'id',
                    'userPrincipalName',
                    'displayName',
                    'givenName',
                    'surname',
                    'mail',
                    'mobilePhone',
                    'businessPhones',
                    'jobTitle',
                    'department',
                    'companyName',
                    'officeLocation',
                    'preferredLanguage',
                    'country',
                    'city',
                    'state',
                    'streetAddress',
                    'postalCode',
                    'usageLocation',
                    'userType',
                    'accountEnabled',
                    'createdDateTime',
                    'signInSessionsValidFromDateTime',
                    'lastPasswordChangeDateTime'
                ].join(','))
                .get();

            // Fetch additional data in parallel
            const [managerInfo, memberOf, photos] = await Promise.allSettled([
                this._getManagerInfo(userId),
                this._getMemberOf(userId),
                this._getProfilePhoto(userId)
            ]);

            // Combine all the data
            const enrichedProfile = {
                // Basic identity
                id: userProfile.id,
                userPrincipalName: userProfile.userPrincipalName,
                displayName: userProfile.displayName,
                givenName: userProfile.givenName,
                surname: userProfile.surname,
                mail: userProfile.mail,
                
                // Contact information
                mobilePhone: userProfile.mobilePhone,
                businessPhones: userProfile.businessPhones,
                
                // Professional information
                jobTitle: userProfile.jobTitle,
                department: userProfile.department,
                companyName: userProfile.companyName,
                officeLocation: userProfile.officeLocation,
                
                // Location information
                country: userProfile.country,
                city: userProfile.city,
                state: userProfile.state,
                streetAddress: userProfile.streetAddress,
                postalCode: userProfile.postalCode,
                usageLocation: userProfile.usageLocation,
                
                // System information
                userType: userProfile.userType,
                accountEnabled: userProfile.accountEnabled,
                preferredLanguage: userProfile.preferredLanguage,
                createdDateTime: userProfile.createdDateTime,
                signInSessionsValidFromDateTime: userProfile.signInSessionsValidFromDateTime,
                lastPasswordChangeDateTime: userProfile.lastPasswordChangeDateTime,
                
                // Manager information
                manager: managerInfo.status === 'fulfilled' ? managerInfo.value : null,
                
                // Group memberships and roles
                memberOf: memberOf.status === 'fulfilled' ? memberOf.value : [],
                
                // Profile photo
                hasProfilePhoto: photos.status === 'fulfilled' && photos.value !== null,
                
                // Metadata
                fetchedAt: new Date().toISOString(),
                graphApiVersion: 'v1.0'
            };

            console.log('✅ User profile fetched successfully:', userProfile.userPrincipalName);
            return enrichedProfile;

        } catch (error) {
            console.error('❌ Error fetching user profile from Graph:', error);
            
            // If Graph API fails, return basic information from token claims
            return {
                error: 'GRAPH_API_ERROR',
                message: error.message,
                fallbackData: true
            };
        }
    }

    /**
     * Get manager information
     * @private
     */
    async _getManagerInfo(userId = 'me') {
        try {
            const manager = await this.client
                .api(`/${userId}/manager`)
                .select('id,displayName,userPrincipalName,jobTitle,department')
                .get();
            
            return {
                id: manager.id,
                displayName: manager.displayName,
                userPrincipalName: manager.userPrincipalName,
                jobTitle: manager.jobTitle,
                department: manager.department
            };
        } catch (error) {
            console.log('ℹ️  Manager information not available');
            return null;
        }
    }

    /**
     * Get group memberships and directory roles
     * @private
     */
    async _getMemberOf(userId = 'me') {
        try {
            const memberOf = await this.client
                .api(`/${userId}/memberOf`)
                .select('id,displayName,description,@odata.type')
                .top(50)
                .get();
            
            return memberOf.value.map(group => ({
                id: group.id,
                displayName: group.displayName,
                description: group.description,
                type: group['@odata.type']
            }));
        } catch (error) {
            console.log('ℹ️  Group membership information not available');
            return [];
        }
    }

    /**
     * Check if user has profile photo
     * @private
     */
    async _getProfilePhoto(userId = 'me') {
        try {
            await this.client
                .api(`/${userId}/photo`)
                .get();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get user's organization information
     * @param {string} accessToken - Valid access token
     * @returns {Object} Organization information
     */
    async getOrganizationInfo(accessToken) {
        try {
            this.initializeClient(accessToken);
            
            const organization = await this.client
                .api('/organization')
                .select('id,displayName,verifiedDomains,tenantType,countryLetterCode,city,state,country')
                .get();
            
            if (organization.value && organization.value.length > 0) {
                const org = organization.value[0];
                return {
                    id: org.id,
                    displayName: org.displayName,
                    verifiedDomains: org.verifiedDomains,
                    tenantType: org.tenantType,
                    countryLetterCode: org.countryLetterCode,
                    city: org.city,
                    state: org.state,
                    country: org.country
                };
            }
            
            return null;
        } catch (error) {
            console.error('❌ Error fetching organization info:', error);
            return null;
        }
    }

    /**
     * Validate access token and get basic user info
     * @param {string} accessToken - Access token to validate
     * @returns {Object} Validation result with basic user info
     */
    async validateToken(accessToken) {
        try {
            this.initializeClient(accessToken);
            
            const userInfo = await this.client
                .api('/me')
                .select('id,userPrincipalName,displayName,accountEnabled')
                .get();
            
            return {
                isValid: true,
                userId: userInfo.id,
                userPrincipalName: userInfo.userPrincipalName,
                displayName: userInfo.displayName,
                accountEnabled: userInfo.accountEnabled
            };
        } catch (error) {
            console.error('❌ Token validation failed:', error);
            return {
                isValid: false,
                error: error.message
            };
        }
    }

    /**
     * Get user's recent sign-in activity (if available)
     * @param {string} accessToken - Valid access token
     * @param {string} userId - User ID
     * @returns {Object} Sign-in activity data
     */
    async getSignInActivity(accessToken, userId = 'me') {
        try {
            this.initializeClient(accessToken);
            
            // Note: This requires specific permissions and may not be available for all tenants
            const signIns = await this.client
                .api('/auditLogs/signIns')
                .filter(`userId eq '${userId}'`)
                .top(10)
                .orderby('createdDateTime desc')
                .select('id,createdDateTime,ipAddress,location,deviceDetail,riskDetail,status')
                .get();
            
            return {
                success: true,
                signIns: signIns.value
            };
        } catch (error) {
            console.log('ℹ️  Sign-in activity not available (requires special permissions)');
            return {
                success: false,
                message: 'Sign-in activity requires additional permissions'
            };
        }
    }

    /**
     * Extract location information from IP address (basic implementation)
     * @param {string} ipAddress - IP address
     * @returns {Object} Location information
     */
    async getLocationFromIP(ipAddress) {
        // This is a placeholder for IP geolocation
        // In production, you might want to use a service like MaxMind GeoIP2
        // or integrate with Azure's location services
        
        if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1') {
            return {
                country: 'Unknown',
                region: 'Unknown',
                city: 'Unknown',
                timezone: 'Unknown'
            };
        }
        
        // For now, return placeholder data
        // TODO: Implement actual IP geolocation service
        return {
            country: 'Unknown',
            region: 'Unknown', 
            city: 'Unknown',
            timezone: 'Unknown',
            note: 'IP geolocation not implemented'
        };
    }
}

module.exports = MicrosoftGraphService;