// src/lib/uploadthing.ts
import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { auth } from '@/lib/auth'

const f = createUploadthing()

export const ourFileRouter = {
  // RFQ attachment uploader — supports PDF, docs, images
  rfqAttachment: f({
    pdf: { maxFileSize: '16MB', maxFileCount: 1 },
    image: { maxFileSize: '8MB', maxFileCount: 3 },
    'application/msword': { maxFileSize: '16MB' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { maxFileSize: '16MB' },
  })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) throw new Error('Unauthorized')
      if (!['ADMIN', 'PROCUREMENT_OFFICER'].includes(session.user.role)) {
        throw new Error('Only procurement officers can upload RFQ attachments')
      }
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('RFQ attachment upload complete:', file.url, 'by user:', metadata.userId)
      return { uploadedBy: metadata.userId, url: file.url }
    }),

  // Invoice PDF uploader
  invoicePdf: f({ pdf: { maxFileSize: '8MB', maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) throw new Error('Unauthorized')
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Invoice PDF upload complete:', file.url)
      return { uploadedBy: metadata.userId, url: file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
