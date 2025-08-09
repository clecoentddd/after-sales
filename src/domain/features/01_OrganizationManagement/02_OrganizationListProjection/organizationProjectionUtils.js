// src/stateViews/organizationProjectionUtils.js

export function insertNewOrganization(currentList, newOrgData) {
  // Avoid duplicates by organizationId? Optional
  if (currentList.find(org => org.organizationId === newOrgData.organizationId)) {
    return currentList;
  }
  return [...currentList, newOrgData];
}
