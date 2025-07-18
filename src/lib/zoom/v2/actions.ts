'use server';

import { KJUR } from 'jsrsasign'

export async function generateZoomSdkSignature(
  meetingNumber: string,
  role: number
) {
  // This function should be on the server, never on the client.
  // It uses the Zoom SDK Key and Secret to generate a signature.
  console.log("Generating signature for meeting number", meetingNumber);
  

  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2; // Expires in 2 hours

  const oHeader = { alg: 'HS256', typ: 'JWT' };

  console.log("Zoom SDK Key", process.env.ZOOM_SDK_KEY);
  console.log("Zoom SDK Secret", process.env.ZOOM_SDK_KEY);

  const oPayload = {
    sdkKey: process.env.ZOOM_SDK_KEY,
    appKey: process.env.ZOOM_SDK_KEY,
    mn: meetingNumber,
    role: role,
    iat: iat,
    exp: exp,
    tokenExp: exp,
  };

  const sHeader = JSON.stringify(oHeader)
  const sPayload = JSON.stringify(oPayload)
  const sdkJWT = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, process.env.ZOOM_SDK_SECRET);
  return sdkJWT;

}