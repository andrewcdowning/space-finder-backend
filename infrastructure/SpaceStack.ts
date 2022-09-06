import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Code, Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { AuthorizationType, LambdaIntegration, MethodOptions, RestApi } from 'aws-cdk-lib/aws-apigateway'
import { GenericTable } from './GenericTable';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { AuthorizerWrapper } from './Auth/AuthorizerWrapper';


export class SpaceStack extends Stack {

    private api = new RestApi(this, 'SpaceApi');
    private authorizerWrapper: AuthorizerWrapper;

    private spacesTable = new GenericTable(this,{
        tableName: 'SpacesTable',
        primaryKey: 'spaceId',
        secondaryIndexes: ['location'],
        createLambdaPath: 'Create',
        readLambdaPath: 'Read',
        deleteLambdaPath: 'Delete',
        updateLambdaPath: 'Update'
    } )

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props)

        this.authorizerWrapper = new AuthorizerWrapper(this, this.api);

        const helloLambdaNodeJs = new NodejsFunction(this, 'helloLambdaNodeJs', {
            entry: (join(__dirname, '..', 'services', 'node_lambda', 'hello.ts')),
            handler: 'handler'
        });
        const s3ListPolicy = new PolicyStatement();
        s3ListPolicy.addActions('s3:ListAllMyBuckets');
        s3ListPolicy.addResources('*')
        helloLambdaNodeJs.addToRolePolicy(s3ListPolicy);

        const optionsWithAuthorizer: MethodOptions = {
            authorizationType: AuthorizationType.COGNITO,
            authorizer: {
                authorizerId: this.authorizerWrapper.authorizer.authorizerId
            }
        };

        // Hello Api lambda integration:
        const helloLambdaIntegration = new LambdaIntegration(helloLambdaNodeJs)
        const helloLambdaResource = this.api.root.addResource('hello');
        helloLambdaResource.addMethod('GET', helloLambdaIntegration, optionsWithAuthorizer);


        //Spaces API integrations:
        const spaceResource = this.api.root.addResource('spaces');
        spaceResource.addMethod('POST', this.spacesTable.createLambdaIntegration, {

        });
        spaceResource.addMethod('GET', this.spacesTable.readLambdaIntegration);
        spaceResource.addMethod('PUT', this.spacesTable.updateLambdaIntegration);
        spaceResource.addMethod('DELETE', this.spacesTable.deleteLambdaIntegration);
    }



}