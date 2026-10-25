import { z } from 'zod'

export const guideSteps = ['Ide', 'Pengguna', 'Fitur', 'Tampilan', 'Teknologi', 'Tinjau'] as const
export const aiTargets = ['summary', 'design', 'dataSettings', 'guided'] as const
export const guidedQuestionSchema = z.object({
  id: z.string().min(1).max(200), step: z.number().int().min(0).max(5),
  question: z.string().max(2000), reason: z.string().max(2000), options: z.array(z.string().max(300)).max(6),
  target: z.enum(aiTargets), field: z.string().max(100), answer: z.string().max(4000), resolved: z.boolean(),
})
export const anchorSchema = z.object({
  description: z.string().max(200000), goal: z.string().max(200000), audience: z.string().max(200000),
  outOfScope: z.string().max(200000), constraints: z.string().max(200000), features: z.array(z.string().max(200)).max(1000),
  savedAt: z.iso.datetime(),
})
export const guidedSchema = z.object({
  step: z.number().int().min(0).max(5), modes: z.array(z.enum(['manual', 'ai'])).length(6),
  answers: z.record(z.string().max(100), z.string().max(200000)),
  questions: z.array(guidedQuestionSchema).max(300), anchor: anchorSchema.optional(),
})
export type GuidedState = z.infer<typeof guidedSchema>
export type GuidedQuestion = z.infer<typeof guidedQuestionSchema>
export type AiTarget = typeof aiTargets[number]
