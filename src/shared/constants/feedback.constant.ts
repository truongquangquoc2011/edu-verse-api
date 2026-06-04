export const FeedbackType = {
  Bug: 'Bug',
  FeatureRequest: 'FeatureRequest',
  CourseContent: 'CourseContent',
  General: 'General',
} as const

export const FeedbackStatus = {
  Pending: 'Pending',
  Reviewed: 'Reviewed',
  Resolved: 'Resolved',
  Closed: 'Closed',
} as const
