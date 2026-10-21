import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { createHmac } from "node:crypto";
import { env } from "../config/env.js";

export const cognito = new CognitoIdentityProviderClient({ region: env.AWS_REGION });

export const accessTokenVerifier = CognitoJwtVerifier.create({
    userPoolId: env.COGNITO_USER_POOL_ID,
    clientId: env.COGNITO_CLIENT_ID,
    tokenUse: "access"
});

// Cognito exige SECRET_HASH cuando el app client tiene client secret
export function secretHash(username: string): string | undefined {
    if (!env.COGNITO_CLIENT_SECRET) return undefined;
    return createHmac("sha256", env.COGNITO_CLIENT_SECRET)
        .update(username + env.COGNITO_CLIENT_ID)
        .digest("base64");
}
