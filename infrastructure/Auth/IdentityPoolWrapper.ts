import { CfnOutput, Token } from "aws-cdk-lib";
import { UserPool, UserPoolClient, CfnIdentityPool, CfnIdentityPoolRoleAttachment } from "aws-cdk-lib/aws-cognito";
import { Effect, FederatedPrincipal, PolicyStatement, Role } from "aws-cdk-lib/aws-iam";
import { CfnIdentity } from "aws-cdk-lib/aws-pinpointemail";
import { Construct } from "constructs";



export class IdentityPoolWrapper {

    private scope: Construct;
    private userPool: UserPool;
    private userPoolClient: UserPoolClient;

    private identityPool: CfnIdentityPool;
    private authRole: Role;
    private unathRole: Role;
    public adminRole: Role;

    constructor(scope: Construct, userPool: UserPool, userPoolClient: UserPoolClient) {
        this.scope = scope,
        this.userPool = userPool,
        this.userPoolClient = userPoolClient
        this.initalize();
    }
    private initalize() {
        this.createIdentityPool();
        this.initializeIamRole();
        this.attachRoles();
    }

    private attachRoles() {
        new CfnIdentityPoolRoleAttachment(this.scope, 'RolesAttachment', {
            identityPoolId: this.identityPool.ref,
            roles: {
                'authenticated': this.authRole.roleArn,
                'unauthenticated': this.unathRole.roleArn
            },
            roleMappings: {
                adminsMapping: {
                    type: 'Token',
                    ambiguousRoleResolution: 'AuthenticatedRole',
                    identityProvider: `${this.userPool.userPoolProviderName}:${this.userPoolClient.userPoolClientId}`
                }
            }
        })
    }


    private initializeIamRole() {
        this.authRole = new Role(this.scope, 'cognitoAuthenticatedRole', {
            assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com',{
                StringEquals: {
                    'cognito-identity.amazonaws.com:aud': this.identityPool.ref
                },
                'ForAnyValue:StringLike': {
                    'cognito-identity.amazonaws.com:amr': 'authenticated'
                }
            },
             "sts:AssumeRoleWithWebIdentity"
            )
        });
        
        this.unathRole  = new Role(this.scope, 'cognitoUnauthenticatedRole', {
            assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com',{
                StringEquals: {
                    'cognito-identity.amazonaws.com:aud': this.identityPool.ref
                },
                'ForAnyValue:StringLike': {
                    'cognito-identity.amazonaws.com:amr': 'unauthenticated'
                }
            },
             "sts:AssumeRoleWithWebIdentity"
            )
        });

        this.adminRole = new Role(this.scope, 'cognitoAdmindRole', {
            assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com',{
                StringEquals: {
                    'cognito-identity.amazonaws.com:aud': this.identityPool.ref
                },
                'ForAnyValue:StringLike': {
                    'cognito-identity.amazonaws.com:amr': 'authenticated'
                }
            },
             "sts:AssumeRoleWithWebIdentity"
            )
        });
        this.adminRole.addToPolicy( new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                's3:ListAllMyBuckets'
            ],
            resources: ['*']
        }))
        
    }

    private createIdentityPool() {
        this.identityPool = new CfnIdentityPool(this.scope, 'SpaceIdentityPool', {
            allowUnauthenticatedIdentities: true,
            cognitoIdentityProviders: [{
                clientId: this.userPoolClient.userPoolClientId,
                providerName: this.userPool.userPoolProviderName
            }]
        });

        new CfnOutput(this.scope, 'IdentityPoolId', {
            exportName: 'IdentityPoolId',
            value: this.identityPool.ref
        });
    };
}