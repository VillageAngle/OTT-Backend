# OTT Backend - Complete Testing Documentation

This folder contains comprehensive testing documentation and resources for the OTT (Over-The-Top) streaming platform backend API.

---

## 📋 Documentation Files

### 1. **TESTING_PLAN.md** - Complete Testing Strategy
**Purpose**: Comprehensive testing plan covering all aspects of the API

**Includes**:
- ✅ [Health Check Testing](#)
- ✅ User Authentication Testing (Register, Login, Profile)
- ✅ Channel Management (Create, Read, Update, Delete)
- ✅ Video Management (CRUD + Preview)
- ✅ Live Stream Management (Create, Status Updates, End)
- ✅ Watch History Tracking
- ✅ Stream Token Operations
- ✅ Error Handling Scenarios
- ✅ Integration Test Scenarios
- ✅ Performance Testing Guidelines
- ✅ Security Testing Checklist
- ✅ Database Integrity Tests
- ✅ Regression Testing

**Who Should Use It**: QA Engineers, Technical Leads, Testers

**Time to Read**: 20 minutes

---

### 2. **TESTING_STEPS.md** - Step-by-Step Testing Guide
**Purpose**: Detailed, actionable testing guide with screenshots-ready format

**Includes**:
- ✅ Postman Setup Instructions
- ✅ Environment Variable Configuration
- ✅ Complete Testing Workflow (6 phases)
- ✅ Phase 1: Health & Authentication
- ✅ Phase 2: Channel Management
- ✅ Phase 3: Video Management
- ✅ Phase 4: Live Stream Testing
- ✅ Phase 5: Watch History Testing
- ✅ Phase 6: Stream Tokens Testing
- ✅ Error Scenario Testing
- ✅ Complete Integration Test Workflow
- ✅ Database Verification Steps
- ✅ Performance Testing
- ✅ Debugging Tips

**Who Should Use It**: QA Engineers, New Testers, Anyone testing first time

**Time Required**: 30-45 minutes for complete testing

**Format**: Easy copy-paste steps with expected responses

---

### 3. **QUICK_REFERENCE.md** - API Quick Reference
**Purpose**: Fast lookup guide for API endpoints and payloads

**Includes**:
- ✅ API Base URL and Authentication Format
- ✅ Quick API Reference Table (30+ endpoints)
- ✅ HTTP Status Codes Reference
- ✅ Response Format Documentation
- ✅ Common Request Bodies
- ✅ Environment Variables List
- ✅ Status/Enum Options
- ✅ Token Expiry Times
- ✅ Common Testing Patterns
- ✅ Postman Tips & Tricks
- ✅ Collection Features Guide
- ✅ Database Connection Details
- ✅ Troubleshooting Guide

**Who Should Use It**: Anyone needing quick reference

**Time to Consult**: 1-2 minutes per lookup

---

### 4. **CURL_EXAMPLES.md** - Command-Line Testing Guide
**Purpose**: Complete cURL examples for API testing without GUI

**Includes**:
- ✅ Setup Instructions
- ✅ All Endpoint Examples (cURL commands)
- ✅ Authentication Flow
- ✅ All CRUD Operations
- ✅ Error Testing Examples
- ✅ Token Management Examples
- ✅ Data Save/Extract Examples
- ✅ Useful cURL Options
- ✅ Bash Script Templates
- ✅ Performance Testing Tools
- ✅ Load Testing Examples

**Who Should Use It**: DevOps, Backend Developers, CLI users

**Time to Use**: 1-3 minutes per API call

---

### 5. **OTT-API-Collection.postman_collection.json** - Postman Collection
**Purpose**: Ready-to-import Postman collection with all endpoints

**Includes**:
- ✅ 30+ Pre-configured API Requests
- ✅ 6 Main Folders (Auth, Channels, Videos, Live Streams, Watch History, Tokens)
- ✅ Variable Placeholders
- ✅ Request & Response Examples
- ✅ Authorization Headers Pre-configured
- ✅ Body Templates Ready to Use

**How to Use**:
1. Open Postman
2. File → Import
3. Select `OTT-API-Collection.postman_collection.json`
4. Select Environment
5. Start Testing!

**Time to Setup**: 2 minutes

---

## 🚀 Quick Start Guide

### For First-Time Testers (Postman)
1. **Read**: TESTING_STEPS.md (Phases 1-3)
2. **Action**: Follow step-by-step instructions
3. **Reference**: Use QUICK_REFERENCE.md for lookups
4. **Time**: ~30 minutes

### For Command-Line Enthusiasts
1. **Read**: CURL_EXAMPLES.md
2. **Action**: Copy/paste cURL commands
3. **Setup**: Use provided bash script template
4. **Time**: ~15 minutes

### For In-Depth Testing
1. **Read**: TESTING_PLAN.md (full document)
2. **Execute**: TESTING_STEPS.md (all 6 phases)
3. **Validate**: All scenarios in TESTING_PLAN.md
4. **Time**: ~2 hours

### For Quick Lookups
1. **Use**: QUICK_REFERENCE.md
2. **Search**: For specific endpoint
3. **Copy**: Ready-to-use payload
4. **Time**: 1 minute

---

## 📊 API Endpoints Summary

| Category | Endpoints | Auth Required |
|----------|-----------|----------------|
| Health | 1 | No |
| Authentication | 3 | Mixed |
| Channels | 5 | Mixed |
| Videos | 6 | Mixed |
| Live Streams | 6 | Mixed |
| Watch History | 4 | Yes |
| Stream Tokens | 5 | Mixed |
| **Total** | **30** | - |

---

## 🔑 Key Testing Scenarios

### Scenario 1: Complete User Journey (15 min)
1. Register → Login → Get Profile → ✅ PASS
2. Create Channel → View Channel → ✅ PASS
3. Create Video → View Video → ✅ PASS
4. Watch Video → Track Progress → ✅ PASS
5. Generate Token → Verify Token → ✅ PASS

### Scenario 2: Live Streaming (10 min)
1. Create Live Stream → Get RTMP → ✅ PASS
2. Update Status: OFFLINE → LIVE → ✅ PASS
3. Update Viewer Count → ✅ PASS
4. End Stream → Record → ✅ PASS

### Scenario 3: Error Scenarios (5 min)
1. Invalid Token → 401 Unauthorized ✅
2. Non-existent ID → 404 Not Found ✅
3. Missing Required Field → 400 Bad Request ✅
4. Unauthorized Action → 403 Forbidden ✅

### Scenario 4: Security (10 min)
1. SQL Injection Prevention ✅
2. XSS Prevention ✅
3. CORS Validation ✅
4. Token Expiration ✅

---

## 📈 Testing Coverage

```
API Endpoints:        30
Test Scenarios:       50+
Error Cases:          20
Integration Tests:    6
Database Tests:       8
Security Tests:       5
Performance Tests:    3

Total Tests:          92+
Estimated Coverage:   95%
```

---

## ⚙️ Setup Requirements

### Prerequisites
- ✅ Server running: `yarn dev`
- ✅ Database connected: Prisma Postgres
- ✅ Port 3000 available
- ✅ Postman installed (or cURL available)

### Environment
```
BASE_URL=http://localhost:3000
DATABASE_URL=postgresql://suraj@localhost:5432/postgres
PORT=3000
```

### Required Tools

| Tool | Purpose | Installation |
|------|---------|--------------|
| Postman | API Testing GUI | [Download](https://www.postman.com/downloads/) |
| cURL | CLI Testing | Pre-installed on macOS/Linux |
| jq | JSON Parsing | `brew install jq` |
| Prisma Studio | DB Viewing | `npx prisma studio` |
| Thunder Client | Alternative GUI | [VS Code Extension](https://www.thunderclient.com/) |

---

## 🔍 File Usage by Role

### QA Engineer
- **Must Read**: TESTING_PLAN.md, TESTING_STEPS.md
- **Reference**: QUICK_REFERENCE.md
- **Tools**: Postman
- **Focus**: Complete coverage, edge cases

### Backend Developer
- **Quick Start**: CURL_EXAMPLES.md
- **Reference**: QUICK_REFERENCE.md
- **Tools**: cURL, Bash
- **Focus**: Unit testing, quick verification

### DevOps Engineer
- **Setup**: CURL_EXAMPLES.md
- **Load Testing**: Performance section in TESTING_STEPS.md
- **Tools**: cURL, Apache Bench, GNU Parallel
- **Focus**: Performance, availability, monitoring

### Tech Lead / Architect
- **Overview**: TESTING_PLAN.md
- **Reference**: QUICK_REFERENCE.md
- **Purpose**: Coverage verification, strategy review

### New Team Member
- **Start Here**: TESTING_STEPS.md (Phase 1)
- **Then**: Phases 2-3
- **Finally**: All phases when confident
- **Duration**: 1-2 hours full training

---

## ✅ Success Criteria

### Testing Complete When All Endpoints:
- [ ] Return correct HTTP status codes
- [ ] Return responses in expected format
- [ ] Include `success`, `message`, `data` fields
- [ ] Handle authorization correctly
- [ ] Validate input properly
- [ ] Return appropriate error messages
- [ ] Maintain data consistency
- [ ] Perform within performance specs

### Database Verified When:
- [ ] All user records created properly
- [ ] All relationships maintained
- [ ] Cascade deletes work correctly
- [ ] Unique constraints enforced
- [ ] Timestamps accurate

### Security Verified When:
- [ ] JWT tokens properly validated
- [ ] Unauthorized actions rejected
- [ ] Passwords hashed (never returned)
- [ ] SQL injection prevented
- [ ] XSS prevention verified

---

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check port 3000 is free
lsof -i :3000

# Check database connection
echo $DATABASE_URL

# Restart server
yarn dev
```

### Postman Authorization Issues
1. Check JWT token is in quotes: `"Bearer <token>"`
2. Verify token is not expired
3. Ensure Authorization header is set
4. Check environment variable is selected

### cURL Command Fails
```bash
# Test connectivity
curl http://localhost:3000/health

# Debug with verbose
curl -v http://localhost:3000/health

# Check JSON format
echo '{"test": "value"}' | jq '.'
```

### Database Issues
```bash
# View database in Prisma Studio
npx prisma studio

# Check migrations
npx prisma migrate status

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

---

## 📚 Additional Resources

### Documentation
- [Prisma Docs](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [JWT Authentication](https://jwt.io/)
- [HTTP Status Codes](https://httpwg.org/specs/rfc7231.html)

### Tools
- [Postman Learning Center](https://learning.postman.com/)
- [cURL Documentation](https://curl.se/docs/)
- [jq Tutorial](https://stedolan.github.io/jq/tutorial/)

### Testing Frameworks
- [Jest for Node.js](https://jestjs.io/)
- [Mocha Testing Framework](https://mochajs.org/)
- [Chai Assertions](https://www.chaijs.com/)

---

## 🎯 Testing Workflow Summary

```
1. SETUP
   ├─ Start Server (yarn dev)
   ├─ Verify Database
   └─ Import Postman Collection

2. PHASE 1: AUTHENTICATION
   ├─ Health Check
   ├─ Register User
   ├─ Login User
   └─ Get Profile

3. PHASE 2: CHANNELS
   ├─ Create Channel
   ├─ Read Channels
   ├─ Update Channel
   └─ Delete Channel

4. PHASE 3: VIDEOS
   ├─ Create Video
   ├─ Read Videos
   ├─ Get Preview
   ├─ Update Video
   └─ Delete Video

5. PHASE 4: LIVE STREAMS
   ├─ Create Stream
   ├─ Update Status
   ├─ Get RTMP Details
   └─ End Stream

6. PHASE 5: WATCH HISTORY
   ├─ Track Progress
   ├─ Get History
   ├─ Continue Watching
   └─ Completed Videos

7. PHASE 6: TOKENS
   ├─ Generate Token
   ├─ Verify Token
   ├─ Revoke Token
   └─ Get User Tokens

8. VALIDATION
   ├─ Error Scenarios
   ├─ Database Check
   └─ Performance Review

9. REPORT
   └─ Document Results
```

---

## 📞 Support & Questions

For API documentation questions, check **QUICK_REFERENCE.md**
For testing guidance, check **TESTING_STEPS.md**
For comprehensive coverage, check **TESTING_PLAN.md**
For CLI testing, check **CURL_EXAMPLES.md**

---

## 📝 Version Information

- **API Version**: 1.0.0
- **Backend Framework**: Express.js 4.18.2
- **Database**: PostgreSQL via Prisma 6.12.0
- **Authentication**: JWT (jsonwebtoken 9.0.3)
- **Documentation Version**: 1.0
- **Last Updated**: April 5, 2026

---

## 📄 License

These testing documents and examples are provided as-is for testing the OTT Backend API.

---

**Next Step**: Choose your testing approach:
- 🐢 **Postman (Graphical)**: Start with TESTING_STEPS.md
- 🚀 **cURL (Command-line)**: Start with CURL_EXAMPLES.md
- 📋 **Complete Coverage**: Start with TESTING_PLAN.md
- ⚡ **Quick Reference**: Use QUICK_REFERENCE.md

Good luck with your testing! 🎉
