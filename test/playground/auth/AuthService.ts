import { Auth } from '@aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { config } from '../auth/config';
import { CognitoUser } from "@aws-amplify/auth";
import * as AWS from 'aws-sdk';
import { CognitoIdentityCredentials, Credentials } from 'aws-sdk'


Amplify.configure({
    Auth: {
        manditorySignIn: false,
        region: config.REGION,
        userPoolId: config.USER_POOL_ID,
        userPoolWebClientId: config.APP_CLIENT_ID,
        identityPoolId: config.IDENTITY_POOL_ID,
        authenticationFlowType: 'USER_PASSWORD_AUTH'
    }
})


export class AuthService {

    public async login(userName: string, password: string) {
        const user = await Auth.signIn(config.TEST_USER_NAME, config.TEST_USER_PASSWORD) as CognitoUser;
        return user;
    }

    public async getTemporaryCreds(user: CognitoUser) {
        const cognitoIdentityPool = `cognito-idp.${config.REGION}.amazonaws.com/${config.USER_POOL_ID}`;
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: config.IDENTITY_POOL_ID,
            Logins: {
                [cognitoIdentityPool]: user.getSignInUserSession()!.getIdToken().getJwtToken()
            },
        });
        await this.refreshCredentials();
    }

    private async refreshCredentials(): Promise<void> {
        return new Promise((resolve, reject) => {
            (AWS.config.credentials as Credentials).refresh(err => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }
}