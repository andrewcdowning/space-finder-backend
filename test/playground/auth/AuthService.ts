import { Auth } from '@aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { config } from '../auth/config';
import { CognitoUser } from "@aws-amplify/auth";

Amplify.configure({
    Auth: {
        manditorySignIn: false,
        region: config.REGION,
        userPoolId: config.USER_POOL_ID,
        userPoolWebClientId: config.APP_CLIENT_ID,
        authenticationFlowType: 'USER_PASSWORD_AUTH'
    }
})


export class AuthService {

    public async login(userName: string, password: string) {
        const user = await Auth.signIn(config.TEST_USER_NAME, config.TEST_USER_PASSWORD) as CognitoUser;
        return user;
    }
}