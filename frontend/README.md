
## AI-Powered Smart Tourism Assistance System with Integrated Travel Companion

**Research Project ID:** J26-IT-464

Gocelone is an AI-powered smart tourism assistance system designed to improve the travel experience of tourists exploring Sri Lanka.

The platform aims to integrate intelligent trip planning, multilingual cultural guidance, weather-aware hotel recommendations, and tourist safety features into a single web-based travel companion.

The project combines web technologies, geolocation services, artificial intelligence, machine learning, and geospatial information to support more convenient, personalized, and informed travel decisions.

> **Project Status:** Research and development prototype. Some features are functional, while advanced AI, payment, weather, and emergency integrations are under development.


## Table of Contents

1. Project Overview
2. Research Objectives
3. Main Research Components
4. System Architecture
5. Technology Stack
6. Project Structure
7. Installation and Setup
8. Environment Configuration
9. API Endpoints
10. Research Methodology
11. Evaluation Metrics
12. Security and Privacy
13. Current Development Status
14. Future Enhancements
15. Research Information
16. License

---

## 1. Project Overview

Sri Lanka offers a wide range of cultural, historical, natural, and recreational tourism experiences.

However, travelers may face several challenges:

- Difficulty creating personalized travel itineraries.
- Uncertainty caused by changing weather conditions.
- Limited access to verified cultural and heritage information.
- Difficulty identifying suitable accommodation.
- Challenges with route navigation in unfamiliar locations.
- Risks associated with misleading pricing and suspicious receipts.
- Limited access to integrated tourist assistance services.

Gocelone proposes a unified intelligent tourism platform to address these challenges through four interconnected research components.

### Proposed Solution

Gocelone provides a centralized application where tourists can:

- Discover destinations throughout Sri Lanka.
- Create and manage travel plans.
- Access GPS-based navigation.
- Explore cultural and heritage information.
- Search for accommodation.
- View weather information when connected to a forecast provider.
- Access tourist safety tools.
- Manage travel-related information within a single interface.

---

## 2. Research Objectives

### Main Objective

To design and develop an AI-powered smart tourism assistance system that improves tourism planning, personalization, decision-making, and safety for travelers in Sri Lanka.

### Specific Objectives

- Develop a personalized travel itinerary planning framework.
- Investigate multi-objective optimization for itinerary generation.
- Explore adaptive replanning techniques for travel disruptions.
- Design a multilingual AI-powered cultural guidance framework.
- Investigate retrieval-augmented generation for grounded tourism information.
- Develop a weather-aware destination suitability framework.
- Investigate personalized hotel recommendation techniques.
- Explore receipt analysis and tourism-related anomaly detection.
- Integrate geolocation and GPS-based travel assistance.
- Evaluate the accuracy, efficiency, usability, and usefulness of the proposed components.

---

## 3. Main Research Components

### 🧭 Component 1: Intelligent Travel Planning and Dynamic Replanning

This component focuses on creating personalized travel plans based on user preferences and available travel constraints.

#### Planned Features

- Personalized itinerary generation.
- Destination preference analysis.
- Budget-aware trip planning.
- Travel duration consideration.
- Interest-based destination selection.
- Multi-destination route planning.
- Dynamic itinerary adjustments.
- Real-time GPS location support.

#### Research Approaches

**NSGA-II (Non-dominated Sorting Genetic Algorithm II)**

Proposed for multi-objective itinerary optimization, considering:

- Travel distance.
- Travel time.
- Budget constraints.
- Tourist preferences.
- Destination suitability.

**Deep Q-Network (DQN)**

Proposed for adaptive replanning when travel conditions change.

Potential triggers include:

- Weather disruptions.
- Changes in travel schedules.
- Destination availability.
- Route deviations.
- Updated tourist preferences.

#### Expected Outcome

An intelligent travel planning framework capable of proposing personalized itineraries and adapting plans to changing travel conditions.

**Implementation Status:** Trip management and prototype GPS routing are available. NSGA-II and DQN integration remain under development.

---

### 🏛️ Component 2: AI-Powered Cultural and Heritage Tour Guide

This component focuses on delivering accessible, multilingual cultural and historical information about Sri Lankan destinations.

#### Planned Features

- AI-powered tourism chatbot.
- Cultural heritage explanations.
- Destination information retrieval.
- Sinhala and English language support.
- Context-aware tourism assistance.
- Source-grounded question answering.
- Conversational destination exploration.

#### Research Approach

**Retrieval-Augmented Generation (RAG)**

The proposed system combines information retrieval and language generation to produce grounded responses using a verified tourism knowledge base.

#### Proposed Workflow

1. The tourist submits a question.
2. The system analyzes the question.
3. Relevant heritage documents are retrieved.
4. Retrieved information is provided as context.
5. The language model generates a response.
6. Source references are included where available.

#### Proposed Technologies

- Python
- Natural Language Processing
- Large Language Models
- FAISS or another vector database
- Multilingual text processing
- Verified cultural and heritage datasets

#### Expected Outcome

A multilingual tourism assistant that provides useful and source-grounded cultural guidance.

**Implementation Status:** Frontend chat interface and backend endpoint structure are available. Verified RAG generation and translation models remain under development.

---

### 🌦️ Component 3: Intelligent Weather and Hotel Recommendation System

This component aims to improve tourism decisions by combining weather suitability with accommodation recommendations.

#### Planned Features

- Destination weather forecasts.
- Weather-based travel suitability.
- Visit Suitability Index (VSI).
- Weather warning notifications.
- Hotel search and filtering.
- Budget-aware accommodation recommendations.
- Location-based hotel suggestions.
- Personalized hotel ranking.

#### Research Approach A: Visit Suitability Index

The proposed Visit Suitability Index evaluates how suitable a destination may be for a visit under particular weather conditions.

Potential factors include:

- Temperature.
- Rainfall.
- Wind speed.
- Relative humidity.
- Destination activity type.
- Weather-related safety considerations.

The index requires research-based weighting, calibration, and validation before production use.

#### Research Approach B: Hotel Recommendation

The proposed recommendation system considers:

- Tourist budget.
- Hotel location.
- Available accommodation information.
- Tourist interests.
- Hotel facilities.
- Destination proximity.
- Verified reviews or ratings, where available.

#### Expected Outcome

An intelligent recommendation framework that supports weather-aware destination selection and more personalized accommodation discovery.

**Implementation Status:** Weather, VSI, hotel search, and recommendation interfaces are included in the prototype. Live provider integrations and validated recommendation models are not yet complete.

---

### 🛡️ Component 4: Tourist Safety, Fraud Detection and GPS Assistance

This component focuses on supporting informed travel decisions and providing safety-related tools for tourists.

#### Planned Features

- GPS-based route visualization.
- Live location display with user permission.
- Route deviation analysis.
- Receipt image processing.
- Suspicious pricing and receipt anomaly detection.
- Fraud alert records.
- Emergency contact information.
- SOS assistance interface.
- Travel safety notifications.

#### Research Approach A: Receipt OCR

**PaddleOCR** is proposed to extract information from receipts, such as:

- Merchant name.
- Purchased items.
- Individual prices.
- Total amount.
- Currency.

#### Research Approach B: Fraud and Anomaly Detection

The proposed anomaly detection framework investigates unusual pricing patterns and potentially inconsistent receipt information.

An anomaly score should be treated as an indication for further checking, not proof of fraud.

#### Research Approach C: Route Deviation Detection

**Dynamic Time Warping (DTW)** is proposed for comparing observed travel trajectories with planned routes.

#### Expected Outcome

A tourism safety assistance framework that can help travelers identify potential irregularities and access relevant safety information.

**Implementation Status:** Prototype GPS navigation, destination markers, route visualization, and safety interfaces are available. OCR, validated fraud models, and emergency dispatch integrations remain under development.

> **Safety Notice:** The current SOS prototype does not automatically contact emergency services. Tourists should contact local emergency services directly during an emergency.

---

## 4. System Architecture

Gocelone follows a modular full-stack architecture.

```text
                  GOCELONE SYSTEM
                         |
                    React Frontend
                         |
                 REST API Communication
                         |
                 Node.js / Express API
                         |
         +---------------+---------------+
         |               |               |
     Authentication    Tourism        AI / Research
         |             Services         Services
         |               |               |
         +---------------+---------------+
                         |
                      MongoDB
                         |
               External Integrations
                         |
          Maps / Weather / AI / Hotels
```

### Application Layers

**Frontend Layer**

Provides a responsive interface for tourists, administrators, and researchers.

**Backend Layer**

Handles API requests, authentication, authorization, validation, and application logic.

**Database Layer**

Stores users, destinations, trips, hotel records, saved places, notifications, and other application data.

**AI and Research Layer**

Contains proposed intelligent optimization, recommendation, retrieval, and anomaly detection components.

**External Services Layer**

Supports map tiles, route services, weather data, and other integrations where available.

---

## 5. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | CSS3, Responsive Design |
| Routing | React Router |
| HTTP Client | Axios |
| Map Visualization | React Leaflet, Leaflet |
| Map Tiles | OpenStreetMap |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB, Mongoose |
| Authentication | Backend authentication and protected routes |
| Validation | Zod |
| Security | Helmet, CORS, Rate Limiting |
| Research / AI | Python-based research components (planned) |
| Route Optimization Research | NSGA-II (planned) |
| Adaptive Replanning Research | DQN (planned) |
| Cultural Question Answering | RAG (planned) |
| Receipt Text Extraction | PaddleOCR (planned) |
| Route Deviation Research | DTW (planned) |

---

## 6. Project Structure

```text
Gocelone/
|
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   ├── layout/
│   │   │   ├── maps/
│   │   │   └── ui/
│   │   ├── contexts/
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   ├── auth/
│   │   │   ├── tourist/
│   │   │   ├── planner/
│   │   │   ├── guide/
│   │   │   ├── maps/
│   │   │   ├── weather/
│   │   │   ├── hotels/
│   │   │   ├── safety/
│   │   │   ├── payments/
│   │   │   ├── admin/
│   │   │   └── research/
│   │   ├── services/
│   │   ├── styles/
│   │   └── main.tsx
│   ├── package.json
│   └── index.html
|
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── app.ts
│   ├── package.json
│   └── tsconfig.json
|
├── .gitignore
└── README.md
```

---

## 7. Installation and Setup

### Prerequisites

Ensure the following software is installed:

- Node.js 24 LTS or a compatible supported version.
- npm.
- MongoDB Community Server or a configured MongoDB instance.
- Git.
- Visual Studio Code or another code editor.

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/Gocelone.git
cd Gocelone
```

Replace `YOUR_USERNAME` with the actual GitHub account name.

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Configure the Backend

Create a `.env` file inside the `backend` directory.

Refer to the Environment Configuration section below.

### Step 4: Start the Backend

```bash
npm run dev
```

The backend is configured to run locally at:

```text
http://localhost:5000
```

Health check endpoint:

```text
http://localhost:5000/health
```

### Step 5: Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

### Step 6: Start the Frontend

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## 8. Environment Configuration

### Backend Environment

Example `backend/.env` configuration:

```env
NODE_ENV=development
PORT=5000

CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb://127.0.0.1:27017/gocelone

# Set secrets and authentication settings
# according to backend/src/config/env.ts
```

Additional environment variables may be required by the authentication configuration and external providers.

### Frontend Environment

Example `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

The exact environment variable name must match the frontend API service implementation.

Never commit passwords, tokens, database credentials, or production secrets to GitHub.

---

## 9. API Endpoints

The backend follows a versioned REST API structure.

Base URL:

```text
http://localhost:5000/api/v1
```

### Core APIs

| Endpoint | Purpose |
|---|---|
| `/auth` | Authentication |
| `/profile` | Tourist profile |
| `/destinations` | Destination discovery |
| `/trips` | Trip management |
| `/maps` | GPS route services |

### Planning and Travel APIs

| Endpoint | Purpose |
|---|---|
| `/dashboard` | Tourist dashboard data |
| `/itineraries` | Itinerary records |
| `/replan` | Planned dynamic replanning |
| `/pois` | Points of interest |
| `/routing` | Planned multi-stop routing |
| `/saved-places` | Saved destinations |

### Guide and Heritage APIs

| Endpoint | Purpose |
|---|---|
| `/guide` | Cultural assistant interface |
| `/heritage` | Heritage data |
| `/translation` | Planned multilingual translation |

### Weather and Hotel APIs

| Endpoint | Purpose |
|---|---|
| `/weather` | Weather information interface |
| `/vsi` | Visit Suitability Index |
| `/hotels` | Hotel data |
| `/recommendations` | Recommendation services |
| `/reviews` | Accommodation reviews |

### Safety APIs

| Endpoint | Purpose |
|---|---|
| `/emergency` | Verified emergency contacts |
| `/navigation` | Planned deviation analysis |
| `/receipts` | Receipt processing interface |
| `/fraud` | Fraud alert records and analysis interface |
| `/sos` | Emergency assistance interface |

### Additional APIs

| Endpoint | Purpose |
|---|---|
| `/admin` | Administrator functions |
| `/bookings` | Booking request records |
| `/payments` | Payment records and integration interface |
| `/refunds` | Refund integration interface |
| `/notifications` | Notifications |
| `/consent` | Privacy preferences |
| `/contact` | Contact messages |
| `/users` | User account information |
| `/research` | Research experiment information |

> API routes may be unavailable or return HTTP 501 until their corresponding modules and external services are implemented.

---

## 10. Research Methodology

The project follows a modular research and development approach.

### Phase 1: Requirement Analysis

- Identify tourist planning challenges.
- Analyze tourism assistance requirements.
- Define functional and nonfunctional requirements.
- Identify data needs and research constraints.

### Phase 2: System Design

- Define frontend and backend architecture.
- Design database structures.
- Establish API contracts.
- Design interface prototypes.
- Define component integration methods.

### Phase 3: Research Model Development

Investigate and develop the proposed approaches:

- NSGA-II for itinerary optimization.
- DQN for dynamic replanning.
- RAG for cultural question answering.
- Weather-based suitability modeling.
- Personalized accommodation recommendation.
- OCR and anomaly detection.
- DTW-based route deviation detection.

### Phase 4: System Integration

- Connect validated models with backend APIs.
- Integrate tourism data sources.
- Connect frontend interfaces.
- Implement error handling and privacy controls.

### Phase 5: Testing and Evaluation

- Functional testing.
- API testing.
- System integration testing.
- Model performance evaluation.
- User experience evaluation.
- Security and privacy testing.

---

## 11. Evaluation Metrics

Proposed evaluation criteria include:

| Component | Potential Evaluation Metrics |
|---|---|
| Itinerary Optimization | Distance, travel time, budget adherence, preference satisfaction |
| Dynamic Replanning | Response time, adaptation quality, itinerary feasibility |
| Cultural Guide | Answer relevance, factual grounding, retrieval quality |
| VSI | Predictive agreement, calibration, suitability classification |
| Hotel Recommendation | Precision@K, Recall@K, NDCG, user satisfaction |
| Receipt OCR | Character error rate, field extraction accuracy |
| Fraud Analysis | Precision, Recall, F1-score, false positive rate |
| Route Deviation | Detection accuracy, false alarm rate, detection delay |
| Web Application | Response time, usability, functional correctness |

These are proposed evaluation metrics, not claims of completed experiments.

---

## 12. Security and Privacy

The system design includes or proposes the following safeguards:

- Authentication and protected routes.
- Role-based authorization.
- API request validation.
- HTTP security headers.
- CORS configuration.
- API rate limiting.
- Privacy preferences for location and other sensitive data.
- Restricted access to personal travel records.
- Secure handling of application secrets.

### Location Privacy

GPS access requires explicit browser permission.

Users should be able to understand when their location is used and control location-sharing permissions.

### Payment Security

The prototype does not process real card payments without a verified payment gateway.

### Emergency Services

The SOS prototype does not automatically dispatch emergency services.

### AI Transparency

Research-stage recommendations and anomaly detection results must not be treated as guaranteed facts or safety assurances.

---

## 13. Current Development Status

| Module | Current Status |
|---|---|
| React Frontend | Prototype implemented |
| Responsive UI | Implemented |
| User Authentication | Backend implementation available |
| Destination Discovery | Backend and frontend implementation available |
| Trip Management | Basic implementation available |
| GPS Map Visualization | Prototype available |
| Road Routing | Prototype service integration available |
| AI Travel Optimization | Under development |
| Dynamic Replanning | Under development |
| Cultural RAG Assistant | Under development |
| Translation Model | Under development |
| Hotel Search | Basic data API structure available |
| Hotel Recommendation Model | Under development |
| Weather Provider Integration | Under development |
| Visit Suitability Index | Under development |
| Receipt OCR | Under development |
| Fraud Detection Model | Under development |
| Payment Gateway | Not connected |
| Emergency Dispatch | Not connected |
| Research Dashboard | Prototype available |

---

## 14. Future Enhancements

Planned improvements include:

- Integrating and evaluating the NSGA-II itinerary optimization model.
- Implementing DQN-based adaptive replanning.
- Building a verified Sri Lankan tourism knowledge base.
- Integrating a multilingual RAG assistant.
- Connecting live weather data providers.
- Training and validating a Visit Suitability Index model.
- Developing personalized hotel recommendation algorithms.
- Integrating OCR-based receipt field extraction.
- Evaluating fraud anomaly detection techniques.
- Improving GPS deviation detection.
- Adding verified notification services.
- Performing end-to-end integration and usability testing.
- Preparing the system for secure deployment.

---

## 15. Research Information

**Project Title:** Gocelone – AI-Powered Smart Tourism Assistance System with Integrated Travel Companion

**Research ID:** J26-IT-464

**Application Domain:** Tourism, Artificial Intelligence, Machine Learning, Geospatial Systems, and Web Application Development.

**Target Region:** Sri Lanka.

**Project Type:** Academic Research and Full-Stack Web Application Prototype.

---

## 16. License

This is an academic research project.

Unless a LICENSE file is added to the repository, no open-source license is granted automatically.

---

## Disclaimer

Gocelone is a research-stage prototype.

Travel recommendations, weather suitability information, route guidance, fraud analysis, and safety-related information should be independently verified where appropriate.

The application is not a substitute for official weather advisories, emergency services, professional navigation systems, or verified hotel booking providers.

---

**Gocelone — Explore Sri Lanka with Intelligent Travel Assistance.**
