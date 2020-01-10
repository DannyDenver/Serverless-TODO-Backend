import { TodosAccess } from "../dataLayer/todosAccess"
import { TodoItem } from "../models/TodoItem"
import { getUserId } from "../lambda/utils"
import { APIGatewayProxyEvent } from "aws-lambda"
import { CreateTodoRequest } from "../requests/CreateTodoRequest"
import * as uuid from 'uuid'
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest"
import { createLogger } from "../utils/logger"

const logger = createLogger('todos')
const todosAccess = new TodosAccess()

export async function getTodos(event: APIGatewayProxyEvent): Promise<TodoItem[]> {
    const userId = getUserId(event)
    logger.info(`Getting todos for user ${userId}`)
    return todosAccess.getTodos(userId)
}

export async function createTodo(event: APIGatewayProxyEvent): Promise<TodoItem> {
    const userId = getUserId(event)
    const todoId = uuid.v4()

    const todoDetails: CreateTodoRequest = JSON.parse(event.body)
    logger.info(`Creating todo ${todoId} for user ${userId}`, todoDetails)

    const newTodo: TodoItem = {
        userId: userId,
        todoId: todoId,
        createdAt: new Date().toISOString(),
        name: todoDetails.name,
        dueDate: todoDetails.dueDate,
        done: false
    }

    return await todosAccess.createTodos(newTodo)
}

export async function deleteTodo(event: APIGatewayProxyEvent): Promise<any> {
    const userId = getUserId(event)
    const todoId = event.pathParameters.todoId
    logger.info(`Deleting todo ${todoId} for user ${userId}`)


    return await todosAccess.deleteTodo(todoId, userId)
}

export async function updateTodo(event: APIGatewayProxyEvent): Promise<boolean> {
    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)
    logger.info(`Updating todo ${todoId} for user ${userId}`, updatedTodo)


    return await todosAccess.updateTodo(userId, todoId, updatedTodo)



}