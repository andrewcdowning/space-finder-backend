import { CfnOutput } from "aws-cdk-lib";
import { CognitoUserPoolsAuthorizer, RestApi } from "aws-cdk-lib/aws-apigateway";
import { CfnUserPoolGroup, UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export class AuthorizerWrapper {
    private scope: Construct;
    private api: RestApi;

    private userPool: UserPool;
    private userPoolClient: UserPoolClient;
    public authorizer: CognitoUserPoolsAuthorizer;

    constructor(scope: Construct, api: RestApi) {
        this.scope = scope;
        this.api = api;
        this.initialize();
    }

    private initialize(){
        this.createUserPool();
        this.addUserPoolClient();
        this.createAuthorizer();
        this.createAdminsGroup();
    };

    private createUserPool() {
        this.userPool = new UserPool(this.scope, 'SpaceUserPool', {
            userPoolName: 'SpaceUserPool',
            selfSignUpEnabled: true,
            signInAliases: {
                username: true,
                email: true
            }
        });
        new CfnOutput(this.scope, 'UserPoolId', {
            value: this.userPool.userPoolId,
            exportName: 'UserPoolId'
        });
    };

    private addUserPoolClient(){
        this.userPoolClient = this.userPool.addClient('SpaceUserPool-Client', {
            userPoolClientName: 'SpaceUserPool-Client',
            authFlows: {
                adminUserPassword: true,
                userPassword: true,
                custom: true,
                userSrp: true
            },
            generateSecret: false,
        });

        new CfnOutput(this.scope, 'UserPoolClientId', {
            value: this.userPoolClient.userPoolClientId,
            exportName: 'UserPoolClientId'
        });
    };

    private createAuthorizer(){
        this.authorizer = new CognitoUserPoolsAuthorizer(this.scope, 'SpaceUserAuthorizer', {
            cognitoUserPools: [this.userPool],
            authorizerName: 'SpaceUserAuthorizer',
            identitySource: 'method.request.header.Authorization',
        });
        this.authorizer._attachToApi(this.api);
    };

    private createAdminsGroup(){
        new CfnUserPoolGroup(this.scope, 'Admins', {
            groupName: 'Admins',
            userPoolId: this.userPool.userPoolId
        })
    }

}