# Food Donation API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Auth Routes

#### Register
- **POST** `/auth/register`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "password": "password123",
    "role": "donor" | "receiver" | "volunteer",
    "organizationName": "NGO Name" // optional, for receivers
  }
  ```

#### Login
- **POST** `/auth/login`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

#### Get Current User
- **GET** `/auth/me`
- **Auth:** Required

#### Update Profile
- **PUT** `/auth/profile`
- **Auth:** Required
- **Body:**
  ```json
  {
    "name": "John Doe",
    "phone": "+1234567890",
    "bio": "About me",
    "organizationName": "NGO Name"
  }
  ```

### Donation Routes

#### Create Donation
- **POST** `/donations`
- **Auth:** Required (Donor/Admin)
- **Body:**
  ```json
  {
    "foodName": "Pizza",
    "foodType": "vegetarian",
    "quantity": 10,
    "unit": "servings",
    "description": "Fresh pizza",
    "location": {
      "address": "123 Main St",
      "coordinates": {
        "lat": 40.7128,
        "lng": -74.0060
      }
    },
    "expiryTime": "2024-01-01T18:00:00Z",
    "availableTimeSlot": {
      "start": "2024-01-01T12:00:00Z",
      "end": "2024-01-01T18:00:00Z"
    },
    "freshness": "freshly-cooked",
    "isEmergency": false
  }
  ```

#### Get All Donations
- **GET** `/donations`
- **Query Params:**
  - `status`: pending | accepted | completed | cancelled
  - `foodType`: vegetarian | non-vegetarian | vegan | dessert | beverage | other
  - `minQuantity`: number
  - `maxDistance`: number (km)
  - `lat`: number
  - `lng`: number
  - `isEmergency`: true | false
  - `page`: number
  - `limit`: number

#### Get Single Donation
- **GET** `/donations/:id`

#### Update Donation
- **PUT** `/donations/:id`
- **Auth:** Required (Owner/Admin)

#### Cancel Donation
- **DELETE** `/donations/:id`
- **Auth:** Required (Owner/Admin)
- **Body:**
  ```json
  {
    "reason": "Cancellation reason"
  }
  ```

#### Accept Donation
- **POST** `/donations/:id/accept`
- **Auth:** Required (Receiver/Admin)

#### Complete Donation
- **POST** `/donations/:id/complete`
- **Auth:** Required (Receiver/Volunteer/Admin)

#### Submit Feedback
- **POST** `/donations/:id/feedback`
- **Auth:** Required (Receiver/Admin)
- **Body:**
  ```json
  {
    "rating": 5,
    "freshnessScore": 10,
    "quality": "excellent" | "good" | "average" | "poor",
    "comments": "Great food!",
    "wouldAcceptAgain": true
  }
  ```

### User Routes

#### Get Dashboard
- **GET** `/users/dashboard`
- **Auth:** Required

#### Get Leaderboard
- **GET** `/users/leaderboard`
- **Query Params:**
  - `role`: donor | receiver | volunteer
  - `limit`: number

### Volunteer Routes

#### Get Available Donations
- **GET** `/volunteers/available`
- **Auth:** Required (Volunteer/Admin)
- **Query Params:**
  - `lat`: number (required)
  - `lng`: number (required)
  - `maxDistance`: number (km, default: 10)

#### Assign to Donation
- **POST** `/volunteers/assign/:donationId`
- **Auth:** Required (Volunteer/Admin)

#### Get My Assignments
- **GET** `/volunteers/my-assignments`
- **Auth:** Required (Volunteer/Admin)

### Admin Routes

#### Get All Users
- **GET** `/admin/users`
- **Auth:** Required (Admin)
- **Query Params:**
  - `role`: donor | receiver | volunteer | admin
  - `isActive`: true | false
  - `page`: number
  - `limit`: number

#### Verify User
- **PUT** `/admin/users/:id/verify`
- **Auth:** Required (Admin)

#### Update User Status
- **PUT** `/admin/users/:id/status`
- **Auth:** Required (Admin)
- **Body:**
  ```json
  {
    "isActive": true | false
  }
  ```

#### Get All Donations
- **GET** `/admin/donations`
- **Auth:** Required (Admin)
- **Query Params:**
  - `status`: pending | accepted | completed | cancelled
  - `page`: number
  - `limit`: number

#### Get Analytics
- **GET** `/admin/analytics`
- **Auth:** Required (Admin)

#### Generate Monthly Report
- **GET** `/admin/reports/monthly`
- **Auth:** Required (Admin)
- **Query Params:**
  - `month`: number (1-12)
  - `year`: number
- **Response:** PDF file

### Notification Routes

#### Get Notifications
- **GET** `/notifications`
- **Auth:** Required
- **Query Params:**
  - `page`: number
  - `limit`: number
  - `unreadOnly`: true | false

#### Mark as Read
- **PUT** `/notifications/:id/read`
- **Auth:** Required

#### Mark All as Read
- **PUT** `/notifications/read-all`
- **Auth:** Required

### Analytics Routes

#### Get Smart Matches
- **GET** `/analytics/matching`
- **Auth:** Required
- **Query Params:**
  - `lat`: number (required)
  - `lng`: number (required)

#### Get Impact Statistics
- **GET** `/analytics/impact`
- **Public**

## WebSocket Events

### Client Events
- `join-room`: Join user's notification room
  ```json
  {
    "userId": "user_id"
  }
  ```

### Server Events
- `notification`: Real-time notification
  ```json
  {
    "id": "notification_id",
    "type": "donation_accepted",
    "title": "Donation Accepted",
    "message": "Your donation has been accepted",
    "data": {},
    "createdAt": "2024-01-01T12:00:00Z"
  }
  ```

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error message"
}
```

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

