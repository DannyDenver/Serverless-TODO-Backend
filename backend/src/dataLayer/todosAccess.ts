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
    private readonly indexName = process.env.INDEX_NAME) {
  }

  async getTodos(userId: string): Promise<TodoItem[]> {
    console.log(this.todosTable)

    const result = await this.docClient.query({
      TableName: this.todosTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise()

    console.log('Results: ', result)

    const items = result.Items
    return items as TodoItem[]
  }

  async createTodos(newTodo: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      TableName: this.todosTable,
      Item: newTodo
    }).promise()

    return newTodo
  }

  async deleteTodo(todoId: string, userId: string) {
    const val = await this.docClient.query({
      TableName: this.todosTable,
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'todoId = :todoId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':todoId': todoId
      },
    }).promise()

    const item = val.Items[0] as TodoItem
    console.log('item', item)

    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        userId: userId,
        createdAt: item.createdAt
      }
    }).promise

    return { deletedTodoId: todoId };
  }

  async updateTodo(userId: string, todoId: string, updatedRequest: UpdateTodoRequest): Promise<boolean> {
    const keys = await this.docClient
      .query({
        TableName: this.todosTable,
        IndexName: this.indexName,
        KeyConditionExpression: 'userId = :userId and todoId = :todoId',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':todoId': todoId
        }
      }).promise()

    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        userId: userId,
        createdAt: keys.Items[0].createdAt
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
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}