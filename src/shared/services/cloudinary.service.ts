import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary'
import { ImageBufferNotFoundException, PdfBufferNotFoundException } from '../constants/file-error.constant'
import { AVATAR_IMAGE_CONFIG as CFG, SUPPORTED_IMAGE_MIME as MIME, SUPPORTED_DOC_MIME } from '../constants/cloudinary.constant'
import path from 'path'
import sharp from 'sharp'
import retry from 'async-retry'

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name)

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    })
  }

  /** Generate a clean, URL-safe public_id */
  private generatePublicId(originalName: string): string {
    const base = path.parse(originalName).name
    return base
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // strip accents
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-') // spaces/underscores -> hyphen
      .replace(/[^a-z0-9-]+/g, '') // strip unsafe chars
      .replace(/-+/g, '-') // collapse multiple hyphens
      .slice(0, CFG.PUBLIC_ID_MAX_LEN) || 'default_file'
  }

  /** Optimize avatar buffer using Sharp */
  private async toAvatarBuffer(file: Express.Multer.File): Promise<Buffer> {
    const img = sharp(file.buffer).rotate().resize(CFG.SIZE, CFG.SIZE, { fit: CFG.FIT, position: CFG.POSITION })
    const mime = file.mimetype.toLowerCase()

    if (mime.includes('jpeg') || mime.includes('jpg') || mime === MIME.JPEG || mime === MIME.JPG) {
      return img.jpeg({ quality: CFG.JPEG_QUALITY, mozjpeg: true }).toBuffer()
    }
    if (mime.includes('png') || mime === MIME.PNG) {
      return img.png({ compressionLevel: CFG.PNG_COMPRESSION_LEVEL, adaptiveFiltering: true }).toBuffer()
    }
    if (mime.includes('webp') || mime === MIME.WEBP) {
      return img.webp({ quality: CFG.WEBP_QUALITY }).toBuffer()
    }
    // default fallback
    return img.jpeg({ quality: CFG.JPEG_QUALITY, mozjpeg: true }).toBuffer()
  }

  /**
   * Upload avatar image with retry
   */
  async uploadImage(file: Express.Multer.File): Promise<string> {
    if (!file?.buffer) throw ImageBufferNotFoundException

    const optimizedBuffer = await this.toAvatarBuffer(file)
    const publicId = this.generatePublicId(file.originalname)

    const retries = this.configService.get<number>('CLOUDINARY_RETRY_ATTEMPTS', 3)
    const minTimeout = this.configService.get<number>('CLOUDINARY_MIN_TIMEOUT_MS', 1000)
    const maxTimeout = this.configService.get<number>('CLOUDINARY_MAX_TIMEOUT_MS', 5000)

    const result = await retry<string>(
      async (bail, attempt) => {
        return new Promise<string>((resolve, reject) => {
          const opts = {
            folder: this.configService.get<string>('CLOUDINARY_DEFAULT_FOLDER', 'uploads'),
            resource_type: 'image' as const,
            public_id: publicId,
            use_filename: CFG.USE_FILENAME,
            unique_filename: CFG.UNIQUE_FILENAME,
            overwrite: CFG.OVERWRITE,
            timeout: CFG.TIMEOUT_MS,
          }

          const stream = cloudinary.uploader.upload_stream(
            opts,
            (error: UploadApiErrorResponse | undefined, res: UploadApiResponse | undefined) => {
              if (error) {
                const httpCode = (error as any)?.http_code as number | undefined
                this.logger.error(`Upload failed (attempt ${attempt}): ${error.message}`)
                if (httpCode === 401 || httpCode === 403) {
                  return bail(new BadRequestException(`Cloudinary authentication failed: ${error.message}`))
                }
                return reject(new BadRequestException(`Upload failed: ${error.message}`))
              }
              if (!res) return reject(new BadRequestException('Upload failed: No result returned'))
              this.logger.log(`Uploaded image: ${res.secure_url}`)
              resolve(res.secure_url)
            },
          )
          stream.end(optimizedBuffer)
        })
      },
      {
        retries,
        factor: 2,
        minTimeout,
        maxTimeout,
        randomize: true,
        onRetry: (error, attempt) => this.logger.warn(`Retrying upload (#${attempt}): ${error.message}`),
      },
    )

    return result
  }

  /**
   * Upload PDF file to Cloudinary
   */
  async uploadPdf(file: Express.Multer.File): Promise<string> {
    if (!file?.buffer) throw PdfBufferNotFoundException

    const maxSize = this.configService.get<number>('MAX_PDF_SIZE_BYTES', 10 * 1024 * 1024) // default 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(`File size exceeds ${maxSize / 1024 / 1024}MB limit`)
    }

    if (file.mimetype !== SUPPORTED_DOC_MIME.PDF) {
      throw new BadRequestException('Only PDF files are allowed')
    }

    const ext = path.extname(file.originalname).toLowerCase().replace('.', '')
    if (ext !== 'pdf') {
      throw new BadRequestException('File must have .pdf extension')
    }

    const publicId = this.generatePublicId(file.originalname)
    const opts = {
      folder: this.configService.get<string>('CLOUDINARY_PDF_FOLDER', 'pdfs'),
      resource_type: 'raw' as const,
      public_id: publicId,
      use_filename: true,
      unique_filename: true,
      overwrite: this.configService.get<boolean>('CLOUDINARY_OVERWRITE', true),
      timeout: this.configService.get<number>('CLOUDINARY_TIMEOUT_MS', 15000),
      format: ext,
    }

    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        opts,
        (error: UploadApiErrorResponse | undefined, res: UploadApiResponse | undefined) => {
          if (error) {
            this.logger.error(`Upload PDF failed: ${error.message}`)
            return reject(new BadRequestException(`Upload PDF failed: ${error.message}`))
          }
          if (!res) {
            return reject(new BadRequestException('Upload PDF failed: No result returned'))
          }
          this.logger.log(`Uploaded PDF: ${res.secure_url}`)
          resolve(res.secure_url)
        },
      )
      stream.end(file.buffer)
    })
  }
}
