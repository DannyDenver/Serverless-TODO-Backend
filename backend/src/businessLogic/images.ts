import { ImagesAccess } from "../dataLayer/imagesAccess";

const imagesAccess = new ImagesAccess()

export function generateUploadUrl(todoId: string): string {
    return imagesAccess.generateUploadUrl(todoId)
}