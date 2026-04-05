import { fal } from '@fal-ai/client'

export async function generarImagenIA(prompt: string): Promise<string | null> {
  if (!process.env.FAL_KEY) return null

  fal.config({ credentials: process.env.FAL_KEY })

  try {
    const result = await fal.run('fal-ai/flux/schnell', {
      input: {
        prompt,
        image_size:            'square_hd',
        num_inference_steps:   4,
        num_images:            1,
        enable_safety_checker: true,
      },
    }) as { images?: Array<{ url: string }> }

    return result.images?.[0]?.url ?? null
  } catch (err) {
    console.error('[fal.ai] Error generating image:', err)
    return null
  }
}
