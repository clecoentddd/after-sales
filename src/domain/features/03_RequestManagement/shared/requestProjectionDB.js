// src/domain/features/03_RequestManagement/requestProjectionDB.js

let requests = [];

export const queryRequestsProjection = () => requests;

export const setRequests = (newRequests) => {
  requests = newRequests;
};

export const clearRequests = () => {
  requests = [];
};

export function queryRaisedRequests() {
  return requests.filter(r => r.status === 'Pending');
}

export function queryClosedRequests() {
  return requests.filter(r => r.status === 'Closed');
}