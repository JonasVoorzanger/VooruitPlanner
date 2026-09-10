import posthog from 'posthog-js'

const posthogEnabled = Boolean(
  import.meta.env.VITE_POSTHOG_PROJECT_TOKEN && import.meta.env.VITE_POSTHOG_HOST,
)

export function captureEvent(eventName, properties) {
  if (posthogEnabled) {
    posthog.capture(eventName, properties)
  }
}

export function captureException(error, properties) {
  if (posthogEnabled) {
    posthog.captureException(error, properties)
  }
}

// Feedback van leerlingen. Staat er in PostHog een survey van het type "API"
// klaar, zet dan het id in VITE_POSTHOG_FEEDBACK_SURVEY_ID: de reactie telt dan
// mee in het survey-overzicht. Zonder dat id komt hetzelfde bericht binnen als
// een gewone gebeurtenis, zodat het formulier ook zonder survey werkt.
const feedbackSurveyId = import.meta.env.VITE_POSTHOG_FEEDBACK_SURVEY_ID

export function captureFeedback(message, properties) {
  if (!posthogEnabled) {
    return
  }

  if (feedbackSurveyId) {
    posthog.capture('survey sent', {
      $survey_id: feedbackSurveyId,
      // De eerste (en enige) vraag van de survey.
      $survey_response: message,
      ...properties,
    })
    return
  }

  posthog.capture('feedback_sent', { feedback: message, ...properties })
}
