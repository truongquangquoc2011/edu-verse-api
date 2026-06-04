
export const QUIZ_PUBLIC_SELECT = {
  id: true,
  title: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  lessonId: true,
  moduleId: true,
} as const
export const QUIZ_QUESTION_PUBLIC_SELECT = {
  id: true,
  quizId: true,
  content: true,
  explanation: true,
  questionOrder: true,
  createdAt: true,
  updatedAt: true,
}

