import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)

import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly bucketName = process.env.IMAGES_S3_BUCKET) {
  }

  async getTodos(userId: string): Promise<TodoItem[]> {
    const result = await this.docClient.query({
      TableName: this.todosTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async getTodo(todoId: string, userId: string): Promise<TodoItem> {
    const result = await this.docClient.query({
      TableName: this.todosTable,
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'todoId = :todoId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':todoId': todoId
      },
    }).promise()

    return result.Items[0] as TodoItem
  }

  async createTodos(newTodo: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      TableName: this.todosTable,
      Item: newTodo
    }).promise()

    return newTodo
  }

  async deleteTodo(todoId: string, userId: string) {
    const todo = await this.getTodo(todoId, userId)

    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        userId: userId,
        createdAt: todo.createdAt
      }
    }).promise()

    return { deletedTodoId: todoId };
  }

  async updateTodo(userId: string, todoId: string, updatedRequest: UpdateTodoRequest): Promise<boolean> {
    const todo = await this.getTodo(todoId, userId)

    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        userId: userId,
        createdAt: todo.createdAt
      },
      UpdateExpression: 'set done = :done, dueDate = :dueDate, #nm = :title',
      ExpressionAttributeNames: {
        "#nm": "name"
      },
      ExpressionAttributeValues: {
        ':done': updatedRequest.done,
        ':dueDate': updatedRequest.dueDate,
        ':title': updatedRequest.name
      },
    }).promise()

    return updatedRequest.done;
  }

  async AddAttachment(userId: string, todoId: string) {
    const todo = await this.getTodo(todoId, userId)
    const link = `https://${this.bucketName}.s3.amazonaws.com/${todoId}`
    
    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        userId: userId,
        createdAt: todo.createdAt
      },
      UpdateExpression: 'set attachmentUrl = :attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': link
      }
    }).promise()
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}