# API Documentation

## Overview

LinkForge Pro provides a RESTful API for URL shortening operations. All endpoints return JSON responses and support CORS for web applications.

## Base URL

```
https://your-api-gateway-url.amazonaws.com/dev
```

## Authentication

Currently, the API is open and does not require authentication. Future versions will include API key authentication.

## Endpoints

### Create Short Link

Create a new short link from a long URL.

**Endpoint:** `POST /links`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "url": "https://example.com/very/long/url/path",
  "customCode": "optional-custom-code"
}
```

**Parameters:**
- `url` (required): The long URL to shorten
- `customCode` (optional): Custom short code (3-50 alphanumeric characters)

**Success Response (201):**
```json
{
  "success": true,
  "shortCode": "abc123",
  "shortUrl": "https://your-domain.com/abc123",
  "targetUrl": "https://example.com/very/long/url/path",
  "createdAt": "2025-12-19T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid URL or custom code
- `409 Conflict`: Custom code already exists
- `500 Internal Server Error`: Server error

### Redirect Short Link

Redirect to the target URL using the short code.

**Endpoint:** `GET /{shortCode}`

**Parameters:**
- `shortCode`: The short code to redirect

**Success Response (301):**
- Redirects to target URL
- Increments click count

**Error Response (404):**
- Returns HTML error page if short code not found

### Admin Dashboard API

Get all links with statistics for the admin dashboard.

**Endpoint:** `GET /admin/links`

**Query Parameters:**
- `limit` (optional): Number of links to return (default: 50)
- `lastKey` (optional): Pagination key for next page

**Success Response (200):**
```json
{
  "success": true,
  "links": [
    {
      "code": "abc123",
      "target_url": "https://example.com",
      "click_count": 42,
      "created_at": "2025-12-19T10:30:00Z",
      "custom_code": false
    }
  ],
  "pagination": {
    "lastKey": null,
    "count": 1
  },
  "statistics": {
    "totalLinks": 150,
    "totalClicks": 3420,
    "averageClicks": 22.8,
    "todayLinks": 12
  }
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

## Rate Limiting

API Gateway provides built-in rate limiting:
- 1000 requests per second per IP
- 10000 requests per day per IP

## CORS

CORS is enabled for all origins with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

## Examples

### Create a short link with curl

```bash
curl -X POST https://your-api-url.com/links \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/very/long/url",
    "customCode": "mylink"
  }'
```

### Create a short link with JavaScript

```javascript
const response = await fetch('https://your-api-url.com/links', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com/very/long/url',
    customCode: 'mylink'
  })
});

const data = await response.json();
console.log(data.shortUrl);
```

### Get admin statistics

```bash
curl https://your-api-url.com/admin/links
```