import { BlobServiceClient, ContainerClient } from '@azure/storage-blob'
import { v4 as uuidv4 } from 'uuid'

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME!

let blobServiceClient: BlobServiceClient | null = null

function getBlobServiceClient(): BlobServiceClient {
  if (!blobServiceClient) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  }
  return blobServiceClient
}

function getContainerClient(containerName: string): ContainerClient {
  return getBlobServiceClient().getContainerClient(containerName)
}

export type ContainerType = 'videos' | 'images' | 'documents' | 'certificates'

export async function uploadFile(
  file: Buffer,
  filename: string,
  containerType: ContainerType,
  mimeType: string
): Promise<{ url: string; blobName: string }> {
  const containerClient = getContainerClient(containerType)

  const extension = filename.split('.').pop() || ''
  const blobName = `${uuidv4()}.${extension}`

  const blockBlobClient = containerClient.getBlockBlobClient(blobName)

  await blockBlobClient.upload(file, file.length, {
    blobHTTPHeaders: {
      blobContentType: mimeType,
    },
  })

  const url = `https://${accountName}.blob.core.windows.net/${containerType}/${blobName}`

  return { url, blobName }
}

export async function deleteFile(blobName: string, containerType: ContainerType): Promise<void> {
  const containerClient = getContainerClient(containerType)
  const blockBlobClient = containerClient.getBlockBlobClient(blobName)
  await blockBlobClient.deleteIfExists()
}

export async function generateSasUrl(
  blobName: string,
  containerType: ContainerType,
  expiresInMinutes: number = 60
): Promise<string> {
  const containerClient = getContainerClient(containerType)
  const blockBlobClient = containerClient.getBlockBlobClient(blobName)

  const startsOn = new Date()
  const expiresOn = new Date(startsOn.getTime() + expiresInMinutes * 60 * 1000)

  const sasUrl = await blockBlobClient.generateSasUrl({
    permissions: { read: true } as never,
    startsOn,
    expiresOn,
  })

  return sasUrl
}

export function getPublicUrl(blobName: string, containerType: ContainerType): string {
  return `https://${accountName}.blob.core.windows.net/${containerType}/${blobName}`
}
