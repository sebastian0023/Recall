import { S3Client } from "@aws-sdk/client-s3";
import { TranscribeClient } from "@aws-sdk/client-transcribe";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { env } from "../config/env.js";

export const s3 = new S3Client({ region: env.AWS_REGION });
export const transcribe = new TranscribeClient({ region: env.AWS_REGION });
export const bedrock = new BedrockRuntimeClient({ region: env.AWS_REGION });