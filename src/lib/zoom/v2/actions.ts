'use server';

import { KJUR } from 'jsrsasign'
import { ZoomService } from './zoom.service';
import getLogger from '~/core/logger';

const logger = getLogger();

export async function generateZoomSdkSignature(
  meetingNumber: string,
  role: number
) {

  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2; // Expires in 2 hours

  const oHeader = { alg: 'HS256', typ: 'JWT' };

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

export async function getAllZoomUsersAction() {
  const zoomService = new ZoomService();
  return await zoomService.getAllZoomUsers();
}

export async function createUnassignedZoomUserAction(email: string) {
  try {
    const zoomService = new ZoomService();
    return await zoomService.createUnassignedZoomUser(email);
  } catch (error) {
    logger.error(error, "Failed to create unassigned zoom user");
    throw new Error("Failed to create unassigned zoom user. Please try again.");
  }

}

export async function getUnassignedZoomUsersAction() {
  const zoomService = new ZoomService();
  return await zoomService.getUnassignedZoomUsers();
}