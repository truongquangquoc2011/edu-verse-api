import { BadRequestException, Type, NestInterceptor } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface'
import { Request } from 'express'
import { FileFilterCallback } from 'multer'
import { extname } from 'path'

/**
 * Configure the file upload interceptor according to the format.
 */
export interface FileUploadOptions {
  /** List of valid MIME types */
  mimetypes: string[]
  /** List of valid file extensions (no dots, e.g. ['pdf']) */
  extensions: string[]
  /** File size limit (bytes), default 5MB */
  maxSize?: number
  /** Form field name, default 'file' */
  fieldName?: string
}

/**
 * Factory function to create a file upload interceptor with flexible validation.
 *
 * @example
 * // Only PDF is allowed
 * export const PdfUploadInterceptor = createFileUploadInterceptor({
 *   mimetypes: ['application/pdf'],
 *   extensions: ['pdf'],
 *   maxSize: 10 * 1024 * 1024, // 10MB
 * })
 *
 * @UseInterceptors(PdfUploadInterceptor)
 * async upload(@UploadedFile() file: Express.Multer.File) { ... }
 */
export function createFileUploadInterceptor(options: FileUploadOptions): Type<NestInterceptor> {
  const {
    mimetypes,
    extensions,
    maxSize = 5 * 1024 * 1024, // 5MB
    fieldName = 'file',
  } = options

  const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Check mimetype
    if (!file.mimetype || !mimetypes.includes(file.mimetype)) {
      return (cb as any)(
        new BadRequestException(`Unsupported file type. Allowed types: ${mimetypes.join(', ')}`),
        false,
      )
    }

    // Check extension
    const fileExt = extname(file.originalname).toLowerCase().replace('.', '')
    if (!extensions.includes(fileExt)) {
      return (cb as any)(
        new BadRequestException(`Invalid file extension. Allowed extensions: ${extensions.join(', ')}`),
        false,
      )
    }

    cb(null, true)
  }

  const multerOptions: MulterOptions = {
    fileFilter,
    limits: { fileSize: maxSize },
  }

  return FileInterceptor(fieldName, multerOptions)
}

/**
 * ✅ Export a pre-configured PDF interceptor
 */
export const PdfUploadInterceptor = createFileUploadInterceptor({
  mimetypes: ['application/pdf'],
  extensions: ['pdf'],
  maxSize: 10 * 1024 * 1024, // 10MB
})
