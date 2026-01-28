# Design Document: Additional UI and Feature Improvements

## Overview

This design addresses seven major improvement areas for the Thus application:

1. **Image Delete Button Visibility**: Enhance delete button contrast on white backgrounds
2. **Subscription Plan API**: Implement subscription management with free and paid tiers
3. **Connector Functionality**: Create connector management interface and backend
4. **Settings Enhancements**: Implement version checking, developer contact, and policy pages
5. **Encryption Request Fix**: Resolve duplicate request issue and ensure single encrypted request
6. **Avatar Hover Effects**: Add visual feedback for avatar interaction
7. **Admin Dashboard**: Create visual configuration interface for system management
8. **File Storage**: Document current implementation and evaluate S3 support

The design follows Vue 3 Composition API patterns on the frontend and Express REST API patterns on the backend, with MongoDB for data persistence.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Vue 3)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Image Preview│  │ Subscription │  │  Connectors  │     │
│  │  Component   │  │    Pages     │  │    Page      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Settings   │  │    Avatar    │  │    Admin     │     │
│  │    Module    │  │  Component   │  │  Dashboard   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Encryption Interceptor (Axios)               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express + Node.js)               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Subscription │  │  Connectors  │  │   Version    │     │
│  │     API      │  │     API      │  │     API      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Policies   │  │    Admin     │  │  Encryption  │     │
│  │     API      │  │     API      │  │  Middleware  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              File Storage Service                     │  │
│  │         (Local FS / S3-compatible)                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │     MongoDB      │
                    │   (Data Store)   │
                    └──────────────────┘
```

### Request Flow

**Normal Request Flow:**
```
User Action → Vue Component → Axios Request → Encryption Check → 
Backend Route → Middleware → Controller → Database → Response
```

**Encrypted Request Flow (Fixed):**
```
User Action → Vue Component → Axios Interceptor (Encrypt Once) → 
Backend Route → Decryption Middleware → Controller → Database → Response
```

## Components and Interfaces

### 1. Image Delete Button Enhancement

**Frontend Component: ImagePreview.vue**

```typescript
// Component structure
interface ImagePreviewProps {
  imageUrl: string;
  onDelete: () => void;
  showDeleteButton?: boolean;
}

// CSS classes for delete button
.delete-button {
  background-color: rgba(128, 128, 128, 0.3); // Light gray default
  transition: all 0.2s ease-in-out;
}

.delete-button:hover {
  background-color: rgba(220, 53, 69, 0.9); // Red on hover
  transform: scale(1.1);
}
```

**Implementation:**
- Use CSS custom properties for color management
- Apply `thus-transition` class for smooth animations
- Ensure WCAG AA contrast ratio (4.5:1 minimum)

### 2. Subscription Plan API

**Backend Models:**

```typescript
// MongoDB Schema
interface SubscriptionPlan {
  _id: ObjectId;
  name: string;
  displayName: string;
  description: string;
  price: number; // 0 for free tier
  currency: string;
  features: string[];
  limitations: {
    maxNotes?: number;
    maxStorage?: number; // in MB
    maxConnectors?: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UserSubscription {
  _id: ObjectId;
  userId: ObjectId;
  planId: ObjectId;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**API Endpoints:**

```typescript
// GET /api/subscriptions/plans
// Response: List of available subscription plans
interface GetPlansResponse {
  plans: SubscriptionPlan[];
}

// POST /api/subscriptions/subscribe
// Request: Subscribe to a plan
interface SubscribeRequest {
  planId: string;
  paymentMethod?: string; // Optional for free tier
}

// Response: Subscription details
interface SubscribeResponse {
  subscription: UserSubscription;
  message: string;
}

// GET /api/subscriptions/current
// Response: Current user's subscription
interface CurrentSubscriptionResponse {
  subscription: UserSubscription | null;
  plan: SubscriptionPlan | null;
}

// POST /api/subscriptions/cancel
// Request: Cancel subscription
interface CancelSubscriptionRequest {
  subscriptionId: string;
  reason?: string;
}
```

**Frontend Pages:**

```typescript
// /subscribe-plan page structure
interface SubscriptionPageState {
  plans: SubscriptionPlan[];
  currentPlan: SubscriptionPlan | null;
  loading: boolean;
  selectedPlan: SubscriptionPlan | null;
}

// Actions
async function loadPlans(): Promise<void>
async function subscribeToPlan(planId: string): Promise<void>
async function cancelSubscription(): Promise<void>
```

### 3. Connector Functionality

**Backend Models:**

```typescript
// MongoDB Schema
interface Connector {
  _id: ObjectId;
  name: string;
  displayName: string;
  description: string;
  icon?: string;
  category: 'storage' | 'ai' | 'productivity' | 'communication';
  configSchema: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'password';
      label: string;
      required: boolean;
      default?: any;
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UserConnector {
  _id: ObjectId;
  userId: ObjectId;
  connectorId: ObjectId;
  config: Record<string, any>;
  isEnabled: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**API Endpoints:**

```typescript
// GET /api/connectors
// Response: List of available connectors
interface GetConnectorsResponse {
  connectors: Connector[];
}

// GET /api/connectors/user
// Response: User's configured connectors
interface GetUserConnectorsResponse {
  userConnectors: (UserConnector & { connector: Connector })[];
}

// POST /api/connectors/enable
// Request: Enable a connector
interface EnableConnectorRequest {
  connectorId: string;
  config: Record<string, any>;
}

// POST /api/connectors/disable
// Request: Disable a connector
interface DisableConnectorRequest {
  userConnectorId: string;
}

// PUT /api/connectors/update
// Request: Update connector configuration
interface UpdateConnectorRequest {
  userConnectorId: string;
  config: Record<string, any>;
}
```

### 4. Settings Module Enhancements

**Version Check Implementation:**

```typescript
// Frontend composable
interface VersionCheckResult {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  downloadUrl?: string;
  releaseNotes?: string;
  mandatory: boolean;
}

async function checkForUpdates(): Promise<VersionCheckResult>
```

**Contact Developer Implementation:**

```typescript
// Backend API
interface ContactRequest {
  subject: string;
  message: string;
  email?: string;
  category: 'bug' | 'feature' | 'question' | 'other';
}

// POST /api/contact/send
// Sends email or stores in database for admin review
```

**Policy Pages:**

```typescript
// Frontend components
// - ServiceAgreement.vue
// - PrivacyPolicy.vue

// Styling improvements:
// - Use custom-style.css classes
// - Add table of contents navigation
// - Implement smooth scrolling
// - Add print-friendly styles
```

### 5. Encryption Request Fix

**Current Problem:**
The axios interceptor sends two requests:
1. Unencrypted request (original)
2. Encrypted request (modified)

**Solution Design:**

```typescript
// Axios request interceptor (frontend)
axios.interceptors.request.use(
  (config) => {
    // Check if encryption is enabled and endpoint requires encryption
    if (shouldEncrypt(config)) {
      // Encrypt payload BEFORE sending
      config.data = encryptPayload(config.data);
      config.headers['X-Encrypted'] = 'true';
    }
    // Return modified config (single request)
    return config;
  },
  (error) => Promise.reject(error)
);

// Backend decryption middleware
function decryptionMiddleware(req, res, next) {
  if (req.headers['x-encrypted'] === 'true') {
    try {
      req.body = decryptPayload(req.body);
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'DECRYPTION_FAILED',
        message: 'Failed to decrypt request payload'
      });
    }
  } else {
    next();
  }
}
```

**Key Changes:**
- Modify payload in interceptor instead of creating new request
- Add `X-Encrypted` header to identify encrypted requests
- Backend checks header and decrypts accordingly
- Single request flow

### 6. Avatar Hover Effects

**Frontend Component Enhancement:**

```typescript
// Avatar.vue component
<template>
  <div 
    class="avatar-container thus-hover"
    @click="openUploadDialog"
    aria-label="点击更换头像"
  >
    <img :src="avatarUrl" alt="User Avatar" />
    <div class="avatar-overlay thus-fade">
      <span class="avatar-hint">更换头像</span>
    </div>
  </div>
</template>

<style scoped>
.avatar-container {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.avatar-hint {
  color: white;
  font-size: 14px;
  font-weight: 500;
}
</style>
```

### 7. Admin Dashboard

**Backend Models:**

```typescript
// Admin user check
interface AdminUser {
  userId: ObjectId;
  role: 'admin' | 'super_admin';
  permissions: string[];
}

// System configuration
interface SystemConfig {
  _id: ObjectId;
  key: string;
  value: any;
  category: 'general' | 'subscription' | 'connector' | 'storage';
  description: string;
  updatedBy: ObjectId;
  updatedAt: Date;
}

// Audit log
interface AuditLog {
  _id: ObjectId;
  userId: ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: any;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}
```

**API Endpoints:**

```typescript
// GET /api/admin/dashboard/stats
// Response: System statistics
interface DashboardStatsResponse {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  activeConnectors: number;
  storageUsed: number;
  recentActivity: AuditLog[];
}

// GET /api/admin/users
// Response: User list with pagination
interface AdminUsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

// POST /api/admin/subscriptions/create
// Request: Create new subscription plan
interface CreatePlanRequest {
  name: string;
  displayName: string;
  description: string;
  price: number;
  features: string[];
  limitations: any;
}

// PUT /api/admin/subscriptions/:id
// Request: Update subscription plan

// DELETE /api/admin/subscriptions/:id
// Request: Deactivate subscription plan

// GET /api/admin/connectors
// Response: All connectors with usage stats

// POST /api/admin/connectors/create
// Request: Create new connector type

// GET /api/admin/config
// Response: System configuration

// PUT /api/admin/config
// Request: Update system configuration

// GET /api/admin/audit-logs
// Response: Audit logs with filtering
```

**Frontend Dashboard:**

```typescript
// Admin dashboard structure
interface AdminDashboardState {
  stats: DashboardStatsResponse;
  selectedTab: 'overview' | 'users' | 'subscriptions' | 'connectors' | 'config';
  loading: boolean;
}

// Components:
// - AdminOverview.vue (statistics and charts)
// - AdminUsers.vue (user management table)
// - AdminSubscriptions.vue (plan management)
// - AdminConnectors.vue (connector configuration)
// - AdminConfig.vue (system settings)
```

### 8. File Storage

**Current Implementation:**

```typescript
// Local file storage
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

interface FileStorageService {
  saveFile(file: Buffer, filename: string): Promise<string>;
  getFile(filename: string): Promise<Buffer>;
  deleteFile(filename: string): Promise<void>;
  getFileUrl(filename: string): string;
}

// Current implementation uses local filesystem
class LocalFileStorage implements FileStorageService {
  async saveFile(file: Buffer, filename: string): Promise<string> {
    const filepath = path.join(UPLOAD_DIR, filename);
    await fs.promises.writeFile(filepath, file);
    return filename;
  }
  
  async getFile(filename: string): Promise<Buffer> {
    const filepath = path.join(UPLOAD_DIR, filename);
    return await fs.promises.readFile(filepath);
  }
  
  async deleteFile(filename: string): Promise<void> {
    const filepath = path.join(UPLOAD_DIR, filename);
    await fs.promises.unlink(filepath);
  }
  
  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }
}
```

**S3 Support Evaluation:**

**Benefits:**
- Scalability: No local disk space limitations
- Reliability: Built-in redundancy and backups
- CDN Integration: Faster global content delivery
- Cost: Pay only for what you use

**Trade-offs:**
- Complexity: Additional configuration required
- Latency: Network requests vs local disk
- Cost: Monthly fees vs free local storage
- Dependencies: External service dependency

**Implementation Approach:**

```typescript
// Abstract storage interface
interface FileStorageService {
  saveFile(file: Buffer, filename: string, metadata?: any): Promise<string>;
  getFile(filename: string): Promise<Buffer>;
  deleteFile(filename: string): Promise<void>;
  getFileUrl(filename: string): string;
}

// S3-compatible implementation
class S3FileStorage implements FileStorageService {
  private s3Client: S3Client;
  private bucketName: string;
  
  constructor(config: S3Config) {
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      endpoint: config.endpoint, // For S3-compatible services
    });
    this.bucketName = config.bucketName;
  }
  
  async saveFile(file: Buffer, filename: string, metadata?: any): Promise<string> {
    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: filename,
      Body: file,
      Metadata: metadata,
    }));
    return filename;
  }
  
  async getFile(filename: string): Promise<Buffer> {
    const response = await this.s3Client.send(new GetObjectCommand({
      Bucket: this.bucketName,
      Key: filename,
    }));
    return Buffer.from(await response.Body.transformToByteArray());
  }
  
  async deleteFile(filename: string): Promise<void> {
    await this.s3Client.send(new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: filename,
    }));
  }
  
  getFileUrl(filename: string): string {
    // Return CDN URL or signed URL
    return `https://${this.bucketName}.s3.amazonaws.com/${filename}`;
  }
}

// Factory pattern for storage selection
function createStorageService(config: StorageConfig): FileStorageService {
  if (config.type === 's3') {
    return new S3FileStorage(config.s3);
  } else {
    return new LocalFileStorage(config.local);
  }
}
```

**Configuration:**

```typescript
// Environment variables
interface StorageConfig {
  type: 'local' | 's3';
  local?: {
    uploadDir: string;
    baseUrl: string;
  };
  s3?: {
    region: string;
    bucketName: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string; // For S3-compatible services
  };
}
```

## Data Models

### Database Schema Updates

**New Collections:**

1. **subscription_plans**
```typescript
{
  _id: ObjectId,
  name: string,
  displayName: string,
  description: string,
  price: number,
  currency: string,
  features: string[],
  limitations: {
    maxNotes: number,
    maxStorage: number,
    maxConnectors: number
  },
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

2. **user_subscriptions**
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  planId: ObjectId,
  status: string,
  startDate: Date,
  endDate: Date,
  autoRenew: boolean,
  paymentMethod: string,
  createdAt: Date,
  updatedAt: Date
}
```

3. **connectors**
```typescript
{
  _id: ObjectId,
  name: string,
  displayName: string,
  description: string,
  icon: string,
  category: string,
  configSchema: object,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

4. **user_connectors**
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  connectorId: ObjectId,
  config: object,
  isEnabled: boolean,
  lastSyncAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

5. **system_config**
```typescript
{
  _id: ObjectId,
  key: string,
  value: any,
  category: string,
  description: string,
  updatedBy: ObjectId,
  updatedAt: Date
}
```

6. **audit_logs**
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  action: string,
  resource: string,
  resourceId: string,
  changes: object,
  ipAddress: string,
  userAgent: string,
  createdAt: Date
}
```

7. **contact_messages**
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  subject: string,
  message: string,
  email: string,
  category: string,
  status: string,
  response: string,
  createdAt: Date,
  respondedAt: Date
}
```

### Updated Collections

**users** (add subscription reference):
```typescript
{
  // ... existing fields
  currentSubscriptionId: ObjectId,
  isAdmin: boolean,
  adminRole: string
}
```

## Correctness Properties


A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Delete Button Contrast Ratio

*For any* delete button rendered on a white background, the contrast ratio between the button color and the background SHALL be at least 4.5:1 to meet WCAG AA standards.

**Validates: Requirements 1.3**

### Property 2: Free Tier Subscription Activation

*For any* user subscribing to a free tier plan, the subscription SHALL be activated without requiring payment information or payment processing.

**Validates: Requirements 2.4**

### Property 3: Subscription Persistence Round Trip

*For any* subscription created through the API, retrieving the subscription from the database SHALL return an equivalent subscription object with all fields preserved.

**Validates: Requirements 2.6**

### Property 4: Subscription Status Permission Update

*For any* subscription status change (active, cancelled, expired), the user's access permissions SHALL be updated to reflect the new subscription tier's limitations.

**Validates: Requirements 2.7**

### Property 5: Connector Configuration Persistence

*For any* connector enabled with a configuration, retrieving the user connector from the database SHALL return the same configuration values.

**Validates: Requirements 3.5**

### Property 6: Connector Deactivation State

*For any* connector that is disabled, the isEnabled flag SHALL be false and the connector SHALL not execute any integration actions.

**Validates: Requirements 3.6**

### Property 7: Version Comparison Correctness

*For any* two semantic version strings (e.g., "1.2.3", "1.3.0"), the version comparison function SHALL correctly determine which version is newer according to semantic versioning rules.

**Validates: Requirements 4.2**

### Property 8: Single Request Per Action

*For any* user action that triggers an API request, exactly one HTTP request SHALL be sent to the backend (no duplicate requests).

**Validates: Requirements 5.1**

### Property 9: Encryption Round Trip

*For any* data payload encrypted by the frontend encryption handler, the backend decryption middleware SHALL successfully decrypt it back to the original payload structure.

**Validates: Requirements 5.2, 5.4**

### Property 10: Encryption Error Logging

*For any* encryption or decryption error that occurs, an error log entry SHALL be created with sufficient detail for debugging.

**Validates: Requirements 5.6**

### Property 11: Storage Backend Abstraction

*For any* storage backend configured (local or S3), the file storage service SHALL successfully save, retrieve, and delete files using the configured backend.

**Validates: Requirements 7.6**

### Property 12: API Request Validation

*For any* API request with an invalid payload (missing required fields, wrong types, etc.), the backend SHALL reject the request with a 400 status code and descriptive error message.

**Validates: Requirements 8.2**

### Property 13: Consistent Error Response Format

*For any* error response returned by the API, the response SHALL follow the standard error format with success=false, error code, and message fields.

**Validates: Requirements 8.3**

### Property 14: Admin Configuration Validation

*For any* configuration change submitted by an admin with invalid values, the system SHALL reject the change and return validation errors.

**Validates: Requirements 9.6**

### Property 15: Admin Configuration Persistence

*For any* configuration saved by an admin, retrieving the configuration from the database SHALL return the same values.

**Validates: Requirements 9.7**

### Property 16: Admin Authorization Check

*For any* non-admin user attempting to access admin dashboard endpoints, the system SHALL return a 403 Forbidden response.

**Validates: Requirements 9.8**

### Property 17: Audit Log Creation

*For any* admin configuration change, an audit log entry SHALL be created with the admin's user ID, action type, resource, and timestamp.

**Validates: Requirements 9.9**

## Error Handling

### Frontend Error Handling

**Axios Error Interceptor:**
```typescript
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data;
      
      switch (error.response.status) {
        case 400:
          showErrorNotification('请求参数错误', errorData.message);
          break;
        case 401:
          showErrorNotification('未授权', '请重新登录');
          router.push('/login');
          break;
        case 403:
          showErrorNotification('权限不足', '您没有权限执行此操作');
          break;
        case 404:
          showErrorNotification('未找到', errorData.message);
          break;
        case 500:
          showErrorNotification('服务器错误', '请稍后重试');
          break;
        default:
          showErrorNotification('错误', errorData.message || '未知错误');
      }
    } else if (error.request) {
      // Request made but no response
      showErrorNotification('网络错误', '无法连接到服务器');
    } else {
      // Error in request setup
      showErrorNotification('错误', error.message);
    }
    
    return Promise.reject(error);
  }
);
```

**Component-Level Error Handling:**
```typescript
// Use try-catch in async functions
async function subscribeToPlan(planId: string) {
  try {
    loading.value = true;
    const response = await api.post('/subscriptions/subscribe', { planId });
    showSuccessNotification('订阅成功');
    await loadCurrentSubscription();
  } catch (error) {
    // Error already handled by interceptor
    console.error('Subscription failed:', error);
  } finally {
    loading.value = false;
  }
}
```

### Backend Error Handling

**Error Response Format:**
```typescript
interface ErrorResponse {
  success: false;
  error: string; // Error code
  message: string; // Human-readable message
  details?: any; // Additional error details
}

function errorResponse(
  error: string,
  message: string,
  details?: any
): ErrorResponse {
  return {
    success: false,
    error,
    message,
    details,
  };
}
```

**Common Error Codes:**
- `BAD_REQUEST`: Invalid request parameters
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `VALIDATION_ERROR`: Data validation failed
- `DECRYPTION_FAILED`: Request decryption failed
- `INTERNAL_ERROR`: Server error

**Route Error Handling:**
```typescript
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { planId } = req.body;
    
    // Validation
    if (!planId) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少planId参数')
      );
    }
    
    // Check if plan exists
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '订阅计划不存在')
      );
    }
    
    // Check if user already has active subscription
    const existingSubscription = await UserSubscription.findOne({
      userId: req.user._id,
      status: 'active',
    });
    
    if (existingSubscription) {
      return res.status(409).json(
        errorResponse('CONFLICT', '您已有活跃的订阅')
      );
    }
    
    // Create subscription
    const subscription = await createSubscription(req.user._id, planId);
    
    return res.json(successResponse({ subscription }));
  } catch (error: any) {
    console.error('Subscription error:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '订阅失败')
    );
  }
});
```

**Validation Middleware:**
```typescript
function validateRequest(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json(
        errorResponse(
          'VALIDATION_ERROR',
          '请求数据验证失败',
          error.details
        )
      );
    }
    next();
  };
}

// Usage
router.post(
  '/subscribe',
  authMiddleware,
  validateRequest(subscribeSchema),
  subscribeHandler
);
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:**
- Specific examples of subscription creation (free tier, paid tier)
- Specific examples of connector enable/disable
- Specific examples of version comparison edge cases
- UI component rendering tests
- API endpoint integration tests
- Error handling scenarios

**Property-Based Tests:**
- Encryption/decryption round trip for random payloads
- Version comparison for random version strings
- Subscription persistence for random subscription data
- Connector configuration persistence for random configs
- Admin authorization for random user roles
- API validation for random invalid payloads

### Testing Framework Selection

**Frontend Testing:**
- **Unit Tests**: Vitest + Vue Test Utils
- **Component Tests**: Vitest + Vue Test Utils
- **E2E Tests**: Playwright or Cypress

**Backend Testing:**
- **Unit Tests**: Jest or Vitest
- **Integration Tests**: Supertest + Jest
- **Property-Based Tests**: fast-check (JavaScript property testing library)

### Property-Based Test Configuration

Each property test MUST:
- Run minimum 100 iterations
- Use appropriate generators for test data
- Include shrinking for minimal failing examples
- Tag with feature name and property number

**Example Property Test:**

```typescript
import fc from 'fast-check';

describe('Feature: additional-ui-and-feature-improvements', () => {
  test('Property 9: Encryption Round Trip', () => {
    // Feature: additional-ui-and-feature-improvements, Property 9: Encryption Round Trip
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.string(),
          action: fc.string(),
          data: fc.anything(),
        }),
        (payload) => {
          const encrypted = encryptPayload(payload);
          const decrypted = decryptPayload(encrypted);
          expect(decrypted).toEqual(payload);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Property 7: Version Comparison Correctness', () => {
    // Feature: additional-ui-and-feature-improvements, Property 7: Version Comparison Correctness
    fc.assert(
      fc.property(
        fc.tuple(
          fc.array(fc.nat(100), { minLength: 3, maxLength: 3 }),
          fc.array(fc.nat(100), { minLength: 3, maxLength: 3 })
        ),
        ([v1Parts, v2Parts]) => {
          const v1 = v1Parts.join('.');
          const v2 = v2Parts.join('.');
          const result = compareVersions(v1, v2);
          
          // Verify comparison is consistent
          if (result > 0) {
            expect(compareVersions(v2, v1)).toBeLessThan(0);
          } else if (result < 0) {
            expect(compareVersions(v2, v1)).toBeGreaterThan(0);
          } else {
            expect(compareVersions(v2, v1)).toBe(0);
          }
          
          // Verify transitivity
          const v3Parts = fc.sample(fc.array(fc.nat(100), { minLength: 3, maxLength: 3 }), 1)[0];
          const v3 = v3Parts.join('.');
          const r12 = compareVersions(v1, v2);
          const r23 = compareVersions(v2, v3);
          const r13 = compareVersions(v1, v3);
          
          if (r12 > 0 && r23 > 0) {
            expect(r13).toBeGreaterThan(0);
          } else if (r12 < 0 && r23 < 0) {
            expect(r13).toBeLessThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Coverage Requirements

**Minimum Coverage Targets:**
- Unit test coverage: 80% of business logic
- Integration test coverage: All API endpoints
- Property test coverage: All correctness properties
- E2E test coverage: Critical user flows

**Critical User Flows to Test:**
1. User subscribes to free tier → subscription activated
2. User enables connector → configuration saved
3. Admin creates subscription plan → plan available to users
4. User uploads file → file stored and retrievable
5. User checks for updates → version comparison works
6. Admin modifies config → audit log created

### Test Execution

**Local Development:**
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run property tests
npm run test:property

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

**CI/CD Pipeline:**
- Run all tests on every commit
- Fail build if coverage drops below threshold
- Run property tests with increased iterations (1000+) on main branch
- Run E2E tests before deployment

## Implementation Notes

### Migration Strategy

1. **Phase 1: Backend API Implementation**
   - Create database schemas
   - Implement API endpoints
   - Add authentication/authorization
   - Write unit and integration tests

2. **Phase 2: Frontend UI Implementation**
   - Create Vue components
   - Implement routing
   - Add styling and animations
   - Write component tests

3. **Phase 3: Integration and Testing**
   - Connect frontend to backend
   - Fix encryption request issue
   - Write property-based tests
   - Run E2E tests

4. **Phase 4: Admin Dashboard**
   - Implement admin authentication
   - Create admin UI components
   - Add audit logging
   - Test admin workflows

5. **Phase 5: Documentation and Deployment**
   - Document file storage implementation
   - Evaluate S3 support
   - Create deployment guide
   - Deploy to production

### Security Considerations

**Authentication:**
- Use JWT tokens for API authentication
- Implement token refresh mechanism
- Add rate limiting to prevent abuse

**Authorization:**
- Check user permissions on every admin endpoint
- Validate subscription status before granting access
- Implement role-based access control (RBAC)

**Data Protection:**
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Sanitize user inputs to prevent XSS
- Use parameterized queries to prevent SQL injection

**Audit Logging:**
- Log all admin actions
- Log authentication attempts
- Log configuration changes
- Store logs securely with retention policy

### Performance Considerations

**Database Optimization:**
- Add indexes on frequently queried fields (userId, planId, connectorId)
- Use connection pooling
- Implement caching for frequently accessed data (subscription plans, connectors)

**Frontend Optimization:**
- Lazy load admin dashboard components
- Use virtual scrolling for long lists
- Implement debouncing for search inputs
- Cache API responses where appropriate

**File Storage:**
- Implement file size limits
- Use streaming for large file uploads
- Add CDN for static assets
- Consider image optimization for avatars

### Backward Compatibility

**API Versioning:**
- Use `/api/v1/` prefix for all endpoints
- Maintain old endpoints during migration
- Provide deprecation notices

**Database Migration:**
- Use migration scripts for schema changes
- Maintain data integrity during migration
- Test rollback procedures

**Frontend Compatibility:**
- Support graceful degradation for older browsers
- Provide fallbacks for unsupported features
- Test on multiple devices and screen sizes
