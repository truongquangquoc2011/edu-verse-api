import { UnprocessableEntityException } from '@nestjs/common'
import { createZodValidationPipe } from 'nestjs-zod'
import { ZodError } from 'zod'

const CustomZodValidationPipe = createZodValidationPipe({
  createValidationException: (error: ZodError) => {
    return new UnprocessableEntityException(
      error.errors.map((error) => {
        return {
          message: error.message,
          path:
            error.code === 'unrecognized_keys' && error.keys?.length === 1
              ? error.keys[0]
              : error.path.length > 0
                ? error.path.join('.')
                : 'body',
        }
      }),
    )
  },
})

export default CustomZodValidationPipe
