# Bhasha Connect

Build the frontend for a production-quality web application called Bhasha – AI-Powered Indian Sign Language Translator.

PROJECT CONTEXT

Bhasha is an assistive technology application designed to help communication between people who use Indian Sign Language (ISL) and people who do not know sign language.

The application will use a separate Computer Vision + Machine Learning backend/model to recognize ISL signs from a webcam feed.

IMPORTANT:

The ML model and backend/API are being developed separately by another part of the project.

Your responsibility is primarily the FRONTEND and user experience.

Do NOT create a fake AI implementation or hardcoded "AI predictions" just to demonstrate functionality.

Instead, create clean interfaces and clearly defined service/API integration points where the real ML backend will later be connected.

Assume the ML backend will expose an API that accepts processed hand/pose information or frames and returns predictions.

The frontend must be designed so the model can be replaced later without redesigning the UI.

DESIGN GOAL

The interface should look like a serious accessibility/assistive-technology product.

Design principles:

Formal

Clean

Minimal

Accessible

Easy to understand

Mobile and desktop responsive

High readability

Clear typography

Strong visual hierarchy

Large interactive controls

Avoid unnecessary animations

Avoid excessive gradients, glassmorphism, or decorative elements

Do not make the interface look like a generic AI dashboard

Use a professional modern color palette with good contrast.

MAIN APPLICATION STRUCTURE

Create the following pages:

1. Home / Landing Page

Purpose:
Explain Bhasha clearly to a first-time visitor.

Include:

Bhasha logo/name

Short description

"Start Translating" primary button

"Learn ISL" secondary button

Brief explanation of how the system works

Accessibility-focused explanation

Features section

Simple workflow visualization:

Camera → Hand Detection → AI Recognition → Text → Speech

Include a disclaimer that recognition accuracy may vary and the system is intended as an assistive tool.

2. Translator Page

This is the main feature.

Create a clean layout with:

LEFT / MAIN AREA:

Webcam/camera preview

Camera permission state

Start Camera button

Stop Camera button

Clear visual indication when the camera is active

Hand detection status

RIGHT / RESULTS AREA:

"Detected Sign"

Large predicted word/sign

Confidence percentage

Prediction status

Example:

Detected Sign
WATER

Confidence
94%

Do NOT hardcode these values as actual AI predictions. Create placeholder state/API integration so the real backend can provide them.

3. Sentence Builder

The system should eventually recognize individual signs and construct basic sentences.

Create a sentence area such as:

Detected Signs:

[ I ] [ WANT ] [ WATER ]

Result:

"I WANT WATER"

Controls:

Undo

Clear

Speak

Save

The sentence builder should be implemented as reusable frontend state/components.

The ML backend may return individual predictions. The frontend should be capable of receiving a stream of predictions and adding them to the sentence builder.

Include a mechanism for preventing the same prediction from being added repeatedly every video frame.

For example, if the model continuously predicts:

WATER
WATER
WATER
WATER

the sentence should NOT become:

WATER WATER WATER WATER

Instead, use a prediction/debounce layer that waits for a stable prediction.

4. Text-to-Speech

Add a "Speak" button.

When the sentence is:

"I WANT WATER"

the browser's Text-to-Speech API should be able to speak the sentence.

Keep this feature modular so it can later be replaced with another speech service.

5. Learn ISL Page

Create a simple learning interface.

Include:

Alphabet/fingerspelling section

Common words

Basic phrases

Sign reference images

Search/filter

Category selection

Categories can include:

Alphabet
Numbers
Greetings
Basic Needs
Questions
Common Words

Each sign card should contain:

Image

Sign name

Short description

Optional example sentence

The actual image/database source can be connected later.

6. Model / System Status

Create a simple status section rather than an overly technical dashboard.

Display:

Camera
● Ready

Hand Detection
● Ready

ML Model
● Connected / Offline

API
● Connected / Offline

Dataset
● Available

These statuses must come from actual application state/API responses when integrated.

7. Accessibility

Accessibility is a major requirement.

Implement:

Keyboard navigation

Proper labels

High contrast

Large buttons

Clear error messages

Clear loading states

Do not rely only on color to communicate status

Accessible alt text

Responsive layout

Screen-reader-friendly labels

COMPONENT ARCHITECTURE

Use reusable components.

Suggested structure:

components/
Navbar
CameraView
PredictionCard
ConfidenceIndicator
SentenceBuilder
SignCard
StatusIndicator
LoadingState
ErrorMessage
SpeakButton
LearnCard

pages/
Home
Translator
Learn
About

services/
mlApi
speechService

The ML integration should be isolated inside something like:

services/mlApi.js

Do not spread API calls throughout UI components.

ML API INTEGRATION

The ML backend is being developed separately.

Create a clean API service abstraction.

For example, conceptually:

sendFrame()
getPrediction()
checkModelStatus()

The exact backend URL should come from an environment variable.

Example:

VITE_ML_API_URL

Do NOT hardcode production API URLs.

The frontend should expect the backend to eventually return structured information similar to:

{
"prediction": "WATER",
"confidence": 0.94
}

For sentence-oriented predictions, allow a response structure that can later support:

{
"prediction": "WATER",
"confidence": 0.94,
"timestamp": "...",
"model_version": "..."
}

Do not assume this exact schema is final. Keep the API layer easy to modify.

MODEL REPLACEMENT

The ML model will be replaceable.

The frontend must NOT depend on a specific ML algorithm.

It should only depend on the API contract.

For example:

Frontend
↓
mlApi service
↓
ML Backend
↓
Current Model

Later:

Frontend
↓
mlApi service
↓
ML Backend
↓
New Model

The frontend should continue working.

DATABASE

Supabase may be used by the backend for:

sign metadata

users

datasets

model metadata

application settings

Do not tightly couple the UI to database internals.

Use service abstractions.

IMPORTANT

Do not generate fake training data.

Do not claim that a model is accurate unless the backend actually provides an evaluated model.

Do not hardcode predictions and present them as AI results.

Create a professional frontend that is ready to connect to the independently developed ML backend.

The final result should feel like a real accessibility product rather than a college-project template.

Use realistic empty/loading/error states throughout the application.

Keep the UI simple enough that a person unfamiliar with technology can understand how to use the translator within a few seconds.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b60eb6aa-fb85-4eb5-beec-9ed50a71bb57).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
