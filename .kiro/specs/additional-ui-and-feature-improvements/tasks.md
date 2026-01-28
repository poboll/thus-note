# Implementation Plan: Additional UI and Feature Improvements

## Overview

This implementation plan breaks down the feature into discrete, incremental coding tasks. The plan follows a phased approach: backend API implementation first, then frontend UI, followed by integration, admin dashboard, and comprehensive testing.

## Tasks

- [ ] 1. Set up database schemas and models
  - Create MongoDB schemas for subscription_plans, user_subscriptions, connectors, user_connectors, system_config, audit_logs, and contact_messages collections
  - Add indexes for frequently queried fields (userId, planId, connectorId, status)
  - Update users schema to include currentSubscriptionId and admin fields
  - _Requirements: 2.6, 3.5, 9.7, 9.9_

- [ ] 2. Implement subscription plan API endpoints
  - [ ] 2.1 Create GET /api/subscriptions/plans endpoint
    - Return list of active subscription plans
    - Include plan details (name, price, features, limitations)
    - _Requirements: 2.2_
  
  - [ ] 2.2 Create POST /api/subscriptions/subscribe endpoint
    - Validate planId parameter
    - Check for existing active subscriptions
    - Create subscription record in database
    - Handle free tier without payment processing
    - Update user's currentSubscriptionId
    - _Requirements: 2.3, 2.4, 2.6_
  
  - [ ] 2.3 Create GET /api/subscriptions/current endpoint
    - Return current user's subscription with plan details
    - Handle case where user has no subscription
    - _Requirements: 2.6_
  
  - [ ] 2.4 Create POST /api/subscriptions/cancel endpoint
    - Validate subscriptionId
    - Update subscription status to 'cancelled'
    - Update user permissions based on new status
    - _Requirements: 2.7_
  
  - [ ] 2.5 Write property test for free tier activation
    - **Property 2: Free Tier Subscription Activation**
    - **Validates: Requirements 2.4**
  
  - [ ] 2.6 Write property test for subscription persistence
    - **Property 3: Subscription Persistence Round Trip**
    - **Validates: Requirements 2.6**
  
  - [ ] 2.7 Write property test for permission updates
    - **Property 4: Subscription Status Permission Update**
    - **Validates: Requirements 2.7**
  
  - [ ] 2.8 Write unit tests for subscription endpoints
    - Test successful subscription creation
    - Test duplicate subscription prevention
    - Test invalid planId handling
    - _Requirements: 2.2, 2.3, 2.4_

- [ ] 3. Implement connector API endpoints
  - [ ] 3.1 Create GET /api/connectors endpoint
    - Return list of available connectors with metadata
    - Include connector name, description, icon, category, configSchema
    - _Requirements: 3.2_
  
  - [ ] 3.2 Create GET /api/connectors/user endpoint
    - Return user's configured connectors
    - Join with connector details
    - _Requirements: 3.2_
  
  - [ ] 3.3 Create POST /api/connectors/enable endpoint
    - Validate connectorId and config against schema
    - Create user_connector record
    - _Requirements: 3.5_
  
  - [ ] 3.4 Create POST /api/connectors/disable endpoint
    - Validate userConnectorId
    - Update isEnabled to false
    - _Requirements: 3.6_
  
  - [ ] 3.5 Create PUT /api/connectors/update endpoint
    - Validate userConnectorId and new config
    - Update connector configuration
    - _Requirements: 3.4_
  
  - [ ] 3.6 Write property test for connector persistence
    - **Property 5: Connector Configuration Persistence**
    - **Validates: Requirements 3.5**
  
  - [ ] 3.7 Write property test for connector deactivation
    - **Property 6: Connector Deactivation State**
    - **Validates: Requirements 3.6**
  
  - [ ] 3.8 Write unit tests for connector endpoints
    - Test connector enable with valid config
    - Test connector disable
    - Test config validation
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 4. Implement settings module API endpoints
  - [ ] 4.1 Enhance GET /api/version/check endpoint
    - Ensure version comparison logic is correct
    - Return updateAvailable, downloadUrl, releaseNotes
    - _Requirements: 4.1, 4.2_
  
  - [ ] 4.2 Create POST /api/contact/send endpoint
    - Validate contact form data (subject, message, category)
    - Store contact message in database
    - Send notification to admin (optional)
    - _Requirements: 4.4_
  
  - [ ] 4.3 Enhance GET /api/policies/terms endpoint
    - Ensure formatted HTML content is returned
    - Include version and lastUpdated fields
    - _Requirements: 4.5_
  
  - [ ] 4.4 Enhance GET /api/policies/privacy endpoint
    - Ensure formatted HTML content is returned
    - Include version and lastUpdated fields
    - _Requirements: 4.6_
  
  - [ ] 4.5 Write property test for version comparison
    - **Property 7: Version Comparison Correctness**
    - **Validates: Requirements 4.2**
  
  - [ ] 4.6 Write unit tests for settings endpoints
    - Test version check with different versions
    - Test contact form submission
    - Test policy retrieval
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6_

- [ ] 5. Fix encryption request issue
  - [ ] 5.1 Modify axios request interceptor
    - Check if encryption is enabled for the endpoint
    - Encrypt payload in-place before sending
    - Add X-Encrypted header
    - Ensure only one request is sent
    - _Requirements: 5.1, 5.2_
  
  - [ ] 5.2 Create backend decryption middleware
    - Check for X-Encrypted header
    - Decrypt request body if encrypted
    - Handle decryption errors with descriptive messages
    - Log encryption errors
    - _Requirements: 5.4, 5.5, 5.6_
  
  - [ ] 5.3 Apply decryption middleware to relevant routes
    - Add middleware to routes that accept encrypted requests
    - _Requirements: 5.4_
  
  - [ ] 5.4 Write property test for encryption round trip
    - **Property 9: Encryption Round Trip**
    - **Validates: Requirements 5.2, 5.4**
  
  - [ ] 5.5 Write property test for single request per action
    - **Property 8: Single Request Per Action**
    - **Validates: Requirements 5.1**
  
  - [ ] 5.6 Write property test for encryption error logging
    - **Property 10: Encryption Error Logging**
    - **Validates: Requirements 5.6**
  
  - [ ] 5.7 Write unit tests for encryption functionality
    - Test successful encryption/decryption
    - Test decryption failure handling
    - Test error logging
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6_

- [ ] 6. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement admin dashboard API endpoints
  - [ ] 7.1 Create admin authentication middleware
    - Check if user has admin role
    - Return 403 for non-admin users
    - _Requirements: 9.8_
  
  - [ ] 7.2 Create GET /api/admin/dashboard/stats endpoint
    - Calculate total users, active subscriptions, total revenue
    - Calculate active connectors, storage used
    - Fetch recent audit logs
    - Require admin authentication
    - _Requirements: 9.10_
  
  - [ ] 7.3 Create GET /api/admin/users endpoint
    - Return paginated user list
    - Include subscription status
    - Require admin authentication
    - _Requirements: 9.5_
  
  - [ ] 7.4 Create POST /api/admin/subscriptions/create endpoint
    - Validate plan data
    - Create new subscription plan
    - Log action in audit_logs
    - _Requirements: 9.2, 9.6, 9.7, 9.9_
  
  - [ ] 7.5 Create PUT /api/admin/subscriptions/:id endpoint
    - Validate plan updates
    - Update subscription plan
    - Log action in audit_logs
    - _Requirements: 9.2, 9.6, 9.7, 9.9_
  
  - [ ] 7.6 Create DELETE /api/admin/subscriptions/:id endpoint
    - Deactivate subscription plan (soft delete)
    - Log action in audit_logs
    - _Requirements: 9.2, 9.7, 9.9_
  
  - [ ] 7.7 Create POST /api/admin/connectors/create endpoint
    - Validate connector data and configSchema
    - Create new connector type
    - Log action in audit_logs
    - _Requirements: 9.3, 9.6, 9.7, 9.9_
  
  - [ ] 7.8 Create GET /api/admin/config endpoint
    - Return all system configuration settings
    - Group by category
    - _Requirements: 9.4_
  
  - [ ] 7.9 Create PUT /api/admin/config endpoint
    - Validate configuration changes
    - Update system_config collection
    - Log action in audit_logs
    - _Requirements: 9.4, 9.6, 9.7, 9.9_
  
  - [ ] 7.10 Create GET /api/admin/audit-logs endpoint
    - Return paginated audit logs
    - Support filtering by user, action, resource
    - _Requirements: 9.9_
  
  - [ ] 7.11 Write property test for admin authorization
    - **Property 16: Admin Authorization Check**
    - **Validates: Requirements 9.8**
  
  - [ ] 7.12 Write property test for config validation
    - **Property 14: Admin Configuration Validation**
    - **Validates: Requirements 9.6**
  
  - [ ] 7.13 Write property test for config persistence
    - **Property 15: Admin Configuration Persistence**
    - **Validates: Requirements 9.7**
  
  - [ ] 7.14 Write property test for audit log creation
    - **Property 17: Audit Log Creation**
    - **Validates: Requirements 9.9**
  
  - [ ] 7.15 Write unit tests for admin endpoints
    - Test admin authentication
    - Test non-admin access denial
    - Test plan creation and updates
    - Test audit log creation
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_

- [ ] 8. Implement API validation and error handling
  - [ ] 8.1 Create request validation middleware
    - Use Joi or similar library for schema validation
    - Return 400 with validation errors
    - _Requirements: 8.2_
  
  - [ ] 8.2 Standardize error response format
    - Ensure all error responses follow { success: false, error, message } format
    - Update all existing endpoints to use standard format
    - _Requirements: 8.3_
  
  - [ ] 8.3 Write property test for API validation
    - **Property 12: API Request Validation**
    - **Validates: Requirements 8.2**
  
  - [ ] 8.4 Write property test for error response format
    - **Property 13: Consistent Error Response Format**
    - **Validates: Requirements 8.3**
  
  - [ ] 8.5 Write unit tests for validation middleware
    - Test validation with invalid payloads
    - Test error response format consistency
    - _Requirements: 8.2, 8.3_

- [ ] 9. Checkpoint - Ensure all backend API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement frontend subscription pages
  - [ ] 10.1 Create SubscriptionPlans.vue page component
    - Fetch and display available subscription plans
    - Show plan features and pricing
    - Add "Subscribe" button for each plan
    - Handle loading and error states
    - _Requirements: 2.1, 2.2_
  
  - [ ] 10.2 Create subscription service composable
    - Implement loadPlans(), subscribeToPlan(), getCurrentSubscription(), cancelSubscription()
    - Handle API errors with user-friendly messages
    - _Requirements: 2.2, 2.3_
  
  - [ ] 10.3 Add /subscribe-plan route to router
    - Configure route with authentication guard
    - _Requirements: 2.1_
  
  - [ ] 10.4 Create CurrentSubscription.vue component
    - Display current subscription details
    - Show plan features and expiration date
    - Add "Cancel Subscription" button
    - _Requirements: 2.7_
  
  - [ ] 10.5 Write component tests for subscription pages
    - Test plan list rendering
    - Test subscription button clicks
    - Test error handling
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 11. Implement frontend connector page
  - [ ] 11.1 Create Connectors.vue page component
    - Fetch and display available connectors
    - Show connector cards with icon, name, description
    - Add "Enable" button for each connector
    - _Requirements: 3.1, 3.2_
  
  - [ ] 11.2 Create ConnectorConfig.vue modal component
    - Display dynamic form based on connector's configSchema
    - Validate configuration inputs
    - Handle save and cancel actions
    - _Requirements: 3.4_
  
  - [ ] 11.3 Create UserConnectors.vue component
    - Display user's enabled connectors
    - Show "Disable" and "Configure" buttons
    - Handle connector status updates
    - _Requirements: 3.2, 3.3, 3.6_
  
  - [ ] 11.4 Create connector service composable
    - Implement loadConnectors(), enableConnector(), disableConnector(), updateConnector()
    - Handle API errors
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ] 11.5 Add /connectors route to router
    - Configure route with authentication guard
    - _Requirements: 3.1_
  
  - [ ] 11.6 Write component tests for connector page
    - Test connector list rendering
    - Test enable/disable functionality
    - Test configuration modal
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 12. Enhance settings module frontend
  - [ ] 12.1 Update Settings.vue to implement version check
    - Add "Check for Updates" button
    - Call version API endpoint
    - Display update notification if available
    - Show download link and release notes
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ] 12.2 Create ContactDeveloper.vue modal component
    - Create form with subject, message, category fields
    - Validate form inputs
    - Submit to contact API endpoint
    - Show success/error messages
    - _Requirements: 4.4_
  
  - [ ] 12.3 Create ServiceAgreement.vue page component
    - Fetch and display service agreement content
    - Add table of contents navigation
    - Implement smooth scrolling
    - Apply improved styling using custom-style.css classes
    - _Requirements: 4.5_
  
  - [ ] 12.4 Create PrivacyPolicy.vue page component
    - Fetch and display privacy policy content
    - Add table of contents navigation
    - Implement smooth scrolling
    - Apply improved styling using custom-style.css classes
    - _Requirements: 4.6_
  
  - [ ] 12.5 Add routes for policy pages
    - Add /service-agreement and /privacy-policy routes
    - _Requirements: 4.5, 4.6_
  
  - [ ] 12.6 Write component tests for settings enhancements
    - Test version check functionality
    - Test contact form submission
    - Test policy page rendering
    - _Requirements: 4.1, 4.4, 4.5, 4.6_

- [ ] 13. Fix image delete button visibility
  - [ ] 13.1 Update ImagePreview.vue component styles
    - Set delete button default color to light gray (rgba(128, 128, 128, 0.3))
    - Add hover state with prominent color (rgba(220, 53, 69, 0.9))
    - Add smooth transition using thus-transition class
    - Ensure scale transform on hover (scale(1.1))
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ] 13.2 Write property test for contrast ratio
    - **Property 1: Delete Button Contrast Ratio**
    - **Validates: Requirements 1.3**
  
  - [ ] 13.3 Write component test for delete button
    - Test default color rendering
    - Test hover color change
    - Test transition animation
    - _Requirements: 1.1, 1.2, 1.4_

- [ ] 14. Implement avatar hover effects
  - [ ] 14.1 Update Avatar.vue component
    - Add avatar-container wrapper with thus-hover class
    - Create avatar-overlay div with fade effect
    - Add "更换头像" hint text
    - Implement hover opacity transition
    - Add aria-label for accessibility
    - Ensure click handler opens upload dialog
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 14.2 Write component test for avatar hover
    - Test overlay visibility on hover
    - Test hint text display
    - Test click handler
    - _Requirements: 6.1, 6.2, 6.4_

- [ ] 15. Checkpoint - Ensure all frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Implement admin dashboard frontend
  - [ ] 16.1 Create AdminDashboard.vue page component
    - Create tab navigation (Overview, Users, Subscriptions, Connectors, Config)
    - Implement admin authentication check
    - Redirect non-admin users to home page
    - _Requirements: 9.1, 9.8_
  
  - [ ] 16.2 Create AdminOverview.vue component
    - Fetch and display dashboard statistics
    - Show total users, active subscriptions, revenue
    - Display recent activity from audit logs
    - Add charts for visual representation (optional)
    - _Requirements: 9.10_
  
  - [ ] 16.3 Create AdminUsers.vue component
    - Fetch and display paginated user list
    - Show user details and subscription status
    - Add search and filter functionality
    - _Requirements: 9.5_
  
  - [ ] 16.4 Create AdminSubscriptions.vue component
    - Display list of subscription plans
    - Add "Create Plan" button and modal
    - Add "Edit" and "Delete" buttons for each plan
    - Implement plan creation and update forms
    - _Requirements: 9.2_
  
  - [ ] 16.5 Create AdminConnectors.vue component
    - Display list of connector types
    - Add "Create Connector" button and modal
    - Show connector usage statistics
    - Implement connector creation form
    - _Requirements: 9.3_
  
  - [ ] 16.6 Create AdminConfig.vue component
    - Display system configuration settings grouped by category
    - Add edit functionality for each setting
    - Validate configuration changes
    - Show save confirmation
    - _Requirements: 9.4, 9.6_
  
  - [ ] 16.7 Create admin service composable
    - Implement all admin API calls
    - Handle authentication errors
    - Provide loading states
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 16.8 Add /admin route to router
    - Configure route with admin authentication guard
    - Add nested routes for each tab
    - _Requirements: 9.1_
  
  - [ ] 16.9 Write component tests for admin dashboard
    - Test admin authentication check
    - Test non-admin redirect
    - Test tab navigation
    - Test CRUD operations
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.8_

- [ ] 17. Document file storage and evaluate S3 support
  - [ ] 17.1 Create FILE_STORAGE.md documentation
    - Document current local file storage implementation
    - Describe file upload and retrieval flow
    - Document storage directory structure
    - Include code examples
    - _Requirements: 7.1, 7.2_
  
  - [ ] 17.2 Add S3 evaluation section to documentation
    - Document technical feasibility of S3 integration
    - List required changes for S3 support
    - Document benefits and trade-offs
    - Provide implementation approach with code examples
    - _Requirements: 7.3, 7.4, 7.5_
  
  - [ ] 17.3 Implement storage service abstraction (optional)
    - Create FileStorageService interface
    - Implement LocalFileStorage class
    - Implement S3FileStorage class (optional)
    - Create factory function for storage selection
    - Add configuration for storage backend selection
    - _Requirements: 7.6, 7.7_
  
  - [ ] 17.4 Write property test for storage backend abstraction
    - **Property 11: Storage Backend Abstraction**
    - **Validates: Requirements 7.6**
  
  - [ ] 17.5 Write unit tests for storage service
    - Test local storage operations
    - Test S3 storage operations (if implemented)
    - Test backend switching
    - _Requirements: 7.6, 7.7_

- [ ] 18. Integration testing and bug fixes
  - [ ] 18.1 Write E2E test for subscription flow
    - Test user subscribes to free tier
    - Test subscription activation
    - Test subscription cancellation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7_
  
  - [ ] 18.2 Write E2E test for connector flow
    - Test user enables connector
    - Test connector configuration
    - Test connector disable
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ] 18.3 Write E2E test for admin dashboard
    - Test admin login
    - Test plan creation
    - Test audit log creation
    - _Requirements: 9.1, 9.2, 9.7, 9.8, 9.9_
  
  - [ ] 18.4 Write E2E test for encryption fix
    - Test that only one request is sent
    - Test successful encryption/decryption
    - _Requirements: 5.1, 5.2, 5.4_
  
  - [ ] 18.5 Fix any integration issues discovered during testing
    - Debug and fix bugs
    - Ensure all features work end-to-end

- [ ] 19. Final checkpoint - Comprehensive testing
  - [ ] 19.1 Run all unit tests and ensure 80%+ coverage
    - _Requirements: 10.1_
  
  - [ ] 19.2 Run all integration tests
    - _Requirements: 10.2_
  
  - [ ] 19.3 Run all property-based tests with 100+ iterations
    - _Requirements: 10.5, 10.6, 10.7, 10.8_
  
  - [ ] 19.4 Run all E2E tests
    - _Requirements: 10.3_
  
  - [ ] 19.5 Generate and review test coverage report
    - Identify any gaps in coverage
    - Add tests for uncovered code
    - _Requirements: 10.4_
  
  - [ ] 19.6 Manual testing of all features
    - Test image delete button visibility
    - Test subscription flow
    - Test connector functionality
    - Test settings enhancements
    - Test encryption fix
    - Test avatar hover effects
    - Test admin dashboard
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 9.1_
  
  - [ ] 19.7 Ensure all tests pass, ask the user if questions arise

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a backend-first approach to establish solid API foundation
- Admin dashboard is implemented last as it depends on other features
- File storage documentation and S3 evaluation can be done in parallel with other tasks
