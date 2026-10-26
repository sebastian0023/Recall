import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { createHmac } from "node:crypto";
import { env } from "../config/env.js";

export const cognito = new CognitoIdentityProviderClient({ region: env.AWS_REGION });

// Se crea al primer uso para que el API pueda arrancar en AUTH_MODE=dummy sin variables de Cognito
let verifier: ReturnType<typeof createVerifier> | undefined;

function createVerifier() {
    return CognitoJwtVerifier.create({
        userPoolId: env.COGNITO_USER_POOL_ID,
        clientId: env.COGNITO_CLIENT_ID,
        tokenUse: "access"
    });
}

export function getAccessTokenVerifier() {
    return (verifier ??= createVerifier());
}

// Cognito exige SECRET_HASH cuando el app client tiene client secret
export function secretHash(username: string): string | undefined {
    if (!env.COGNITO_CLIENT_SECRET) return undefined;
    return createHmac("sha256", env.COGNITO_CLIENT_SECRET)
        .update(username + env.COGNITO_CLIENT_ID)
        .digest("base64");
}
