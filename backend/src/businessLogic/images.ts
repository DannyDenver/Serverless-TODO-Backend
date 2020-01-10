import { ImagesAccess } from "../dataLayer/imagesAccess";
import { APIGatewayEvent } from "aws-lambda";
import { getUserId } from "../lambda/utils";
import { TodosAccess } from "../dataLayer/todosAccess";
import { createLogger } from "../utils/logger";

const logger = createLogger('todos')

const imagesAccess = new ImagesAccess()
const todosAccess = new TodosAccess()

export async function generateUploadUrl(event: APIGatewayEvent): Promise<string> {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)

    logger.info(`Attaching image to todo ${todoId} for user ${userId}`)

    const attachmentUrl = imagesAccess.generateUploadUrl(todoId)

    await todosAccess.AddAttachment(userId, todoId)
    
    return attachmentUrl
}