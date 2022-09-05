import { APIGatewayEvent } from "aws-lambda";


export function generateRandomId(): string{
    return Math.random().toString(36).slice(2);
}

export function getEventBody(event: APIGatewayEvent){
    return typeof event.body == 'object'? event.body: JSON.parse(event.body);

}