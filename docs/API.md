# ERIZON AI - API Reference

## Base URL
```
http://localhost:3001 (development)
https://api.erizon.ai (production)
```

## Authentication
All endpoints require authentication headers (to be implemented):
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## Health & Status

### Health Check
```
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-06-02T12:30:00Z",
  "environment": "development"
}
```

### API Version
```
GET /api/version
```

### Orchestrator Stats
```
GET /api/orchestrator/stats
```

---

## Agents

### Get All Agents
```
GET /api/agents
```
**Query Parameters:**
- `department` (optional) - Filter by department

**Response:**
```json
{
  "success": true,
  "data": {
    "total_agents": 36,
    "departments": {...},
    "agents": [...]
  }
}
```

### Get Agent by ID
```
GET /api/agents/:id
```

### Get Agent Status
```
GET /api/agents/:id/status
```

### Get Agents by Department
```
GET /api/agents/department/:dept
```

---

## Content Management

### Get All Content
```
GET /api/content
```
**Query Parameters:**
- `status` - Filter by status (draft, pending_approval, approved, published)
- `type` - Filter by type (story, feed, carousel, reel, video)
- `page` - Pagination page (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 45,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

### Create Content
```
POST /api/content
Content-Type: application/json

{
  "title": "Summer Campaign 2026",
  "type": "reel",
  "caption": "Content description",
  "objective": "Brand awareness",
  "images": ["url1", "url2"],
  "videos": ["url1"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "content-123456",
    "title": "Summer Campaign 2026",
    "type": "reel",
    "status": "draft",
    "neuro_score": null,
    "created_at": "2026-06-02T12:30:00Z"
  }
}
```

### Get Content by ID
```
GET /api/content/:id
```

### Update Content
```
PUT /api/content/:id
Content-Type: application/json

{
  "caption": "Updated caption",
  "objective": "Lead generation"
}
```

### Delete Content
```
DELETE /api/content/:id
```

### Analyze Content (Neuro Score)
```
POST /api/content/:id/analyze
```

**Response:**
```json
{
  "success": true,
  "data": {
    "neuro_score": {
      "overall": 87,
      "attention": 8.5,
      "emotion": 8.2,
      "curiosity": 8.8,
      "engagement_potential": "very_high",
      "conversion_potential": "high",
      "suggestions": [...]
    }
  }
}
```

### Approve Content
```
POST /api/content/:id/approve
Content-Type: application/json

{
  "reviewed_by": "user-id",
  "feedback": "Looks great!"
}
```

### Publish Content
```
POST /api/content/:id/publish
Content-Type: application/json

{
  "platforms": ["instagram", "facebook", "linkedin"],
  "schedule_for": "2026-06-03T09:00:00Z"
}
```

---

## Metrics & Analytics

### Get Current Metrics
```
GET /api/metrics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reach": 15234,
    "impressions": 48920,
    "followers": 2847,
    "engagement": 523,
    "engagement_rate": 0.0107,
    "ctr": 0.045,
    "cpc": 0.85,
    "leads": 128,
    "conversions": 42,
    "cac": 12.5,
    "roi": 3.2,
    "roas": 4.1,
    "revenue": 42500,
    "updated_at": "2026-06-02T12:30:00Z"
  }
}
```

### Get Dashboard Metrics
```
GET /api/metrics/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "marketing_score": 78,
      "branding_score": 82,
      "growth_score": 75,
      "neuro_score": 87
    },
    "alerts": [...],
    "opportunities": [...]
  }
}
```

### Get Metrics History
```
GET /api/metrics/history?days=30
```

---

## Orchestration

### Get Agent Registry
```
GET /api/orchestrator/registry
```

**Response:**
```json
{
  "success": true,
  "data": {
    "Executive Council": [...],
    "Marketing Department": [...],
    "Traffic Department": [...]
  }
}
```

### Execute Executive Meeting
```
POST /api/orchestrator/meeting/executive
Content-Type: application/json

{
  "context": {
    "period": "monthly",
    "focus": "growth"
  }
}
```

### Execute Content Production
```
POST /api/orchestrator/workflow/content-production
Content-Type: application/json

{
  "context": {
    "content_count": 5,
    "types": ["story", "feed", "reel"]
  }
}
```

### Execute Traffic Optimization
```
POST /api/orchestrator/workflow/traffic-optimization
Content-Type: application/json

{
  "context": {
    "period": "weekly",
    "focus": "roi"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Rate Limiting
- Default: 1000 requests/hour per API key
- Burst: 50 requests/minute

## Webhooks
Webhooks for:
- `content.approved`
- `content.published`
- `metrics.alert`
- `agent.task_completed`

---

**API Version**: 1.0.0
**Last Updated**: 2026-06-02
