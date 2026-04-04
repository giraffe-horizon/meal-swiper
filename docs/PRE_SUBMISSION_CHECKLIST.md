# Pre-Submission Checklist

## Legal & Privacy
- [ ] Privacy Policy URL hosted (CF Pages or similar)
- [ ] Delete Account flow tested end-to-end

## App Store Assets
- [ ] App Store screenshots (6.7 inch, 6.1 inch)
- [ ] App Store description PL/EN

## Developer Accounts
- [ ] Apple Developer account configured
- [ ] Google Play Developer account configured

## Build Configuration
- [ ] app.json bundleIdentifier + package set
- [ ] expo-updates: run `eas init`, set real project UUID, then set `enabled: true` in app.json
- [ ] EAS credentials configured (eas credentials)

## Store Listings & Compliance
- [ ] Apple: App Privacy details questionnaire
- [ ] Google: Data Safety form
- [ ] Both: Content rating questionnaire
- [ ] Both: App category selection (Food & Drink)
- [ ] Apple: App Review Information (contact, demo account if needed)
- [ ] Apple: Age rating
- [ ] Google: Target audience and content

## Build Configuration (extra.apiKey)
- [ ] Set `apiKey` in app.json via EAS secrets before production build (see Build Configuration below)

## Build & Testing
- [ ] First production build: eas build --profile production
- [ ] TestFlight internal testing
- [ ] Google Play Internal Testing track
