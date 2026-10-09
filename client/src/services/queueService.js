/**
 * queueService.js — The live clinic queue (final-vet's queue): the public board for the home
 * page, a pet owner's own place in line, and the veterinarian's actions — check a pet in when
 * it arrives, call it in, complete the visit, or undo the last step. Each action returns the
 * refreshed board.
 */
import axiosClient from '../api/axiosClient';
import { APPOINTMENTS_CHANGED_EVENT } from '../utils/constants';

/** GET /queue — today's board: queue numbers and pet names per vet lane (no owner details). */
export async function getPublicQueue() {
  const { data } = await axiosClient.get('/queue');
  return data;
}

/** GET /queue/mine (pet owner) — my visits today with my place in line and estimated wait. */
export async function getMyQueue() {
  const { data } = await axiosClient.get('/queue/mine');
  return data;
}

/** GET /queue/manage (vet) — the full board with owner names and mobile numbers. */
export async function getQueueBoard() {
  const { data } = await axiosClient.get('/queue/manage');
  return data;
}

/** Runs a queue action, then lets badges and dashboards refresh. */
async function act(visitId, action) {
  const { data } = await axiosClient.patch(`/queue/${encodeURIComponent(visitId)}/${action}`);
  window.dispatchEvent(new Event(APPOINTMENTS_CHANGED_EVENT));
  return data;
}

/** PATCH /queue/:visitId/check-in — the pet has arrived (now waiting). */
export const checkInVisit = (visitId) => act(visitId, 'check-in');

/** PATCH /queue/:visitId/call — the vet calls the patient in (one at a time per vet). */
export const callInVisit = (visitId) => act(visitId, 'call');

/** PATCH /queue/:visitId/complete — the consultation is finished. */
export const completeVisit = (visitId) => act(visitId, 'complete');

/** PATCH /queue/:visitId/undo — one step back (with the vet → waiting → not checked in). */
export const undoQueueStep = (visitId) => act(visitId, 'undo');
