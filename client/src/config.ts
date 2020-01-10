// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = '33b6mxvauf'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map
  domain: 'dannydenver.auth0.com',            // Auth0 domain
  clientId: 'C2LriQG2G8XBDXUdxu1Vgjm9PjOp1G8j',          // Auth0 client id
  callbackUrl: 'http://localhost:3001/callback'
}
