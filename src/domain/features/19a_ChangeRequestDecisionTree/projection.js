// src/domain/features/ChangeRequestDecisionTree/projection.js

const changeRequestDecisionState = {}; // { [requestId]: { quotationStatus, jobStatus } }
const listeners = new Set();

export const ChangeRequestDecisionTreeProjection = {
  /**
   * Returns the current decision state for a request.
   * @param {string} requestId
   * @returns {{ quotationStatus: string, jobStatus: string } | undefined}
   */
  getState(requestId) {
    return changeRequestDecisionState[requestId];
  },

  /**
   * Returns all request decision states as an array.
   * @returns {Array<{ requestId: string, quotationStatus: string, jobStatus: string }>}
   */
  getAll() {
    return Object.entries(changeRequestDecisionState).map(([requestId, state]) => ({
      requestId,
      quotationStatus: state.quotationStatus,
      jobStatus: state.jobStatus,
    }));
  },

  /**
   * Subscribe to changes in the projection.
   * Callback is called with current array of all states whenever updated.
   * Returns an unsubscribe function.
   * @param {(data: Array) => void} callback
   */
  subscribe(callback) {
    listeners.add(callback);
    // Immediately send current data on subscribe
    callback(this.getAll());
    return () => {
      listeners.delete(callback);
    };
  },

  /**
   * Notify all subscribers of updated state.
   */
 notify() {
  const allData = this.getAll();
  console.log(`[DecisionProjection] Notifying ${listeners.size} subscribers with data:`, allData);
  listeners.forEach(cb => {
    try {
      cb(allData);
      console.log('[DecisionProjection] Subscriber callback executed successfully.');
    } catch (err) {
      console.error('[DecisionProjection] Subscriber callback error:', err);
    }
  });
},

  /**
   * Reset the internal state.
   */
  reset() {
    for (const key in changeRequestDecisionState) {
      delete changeRequestDecisionState[key];
    }
    this.notify();
  },

  /**
   * Handles updates to the projection based on events.
   * @param {object} event
   */
  handleEvent(event) {
    const { type, data } = event;

    switch (type) {
      case 'RequestCreated':
        changeRequestDecisionState[data.requestId] = {
          quotationStatus: 'NotStarted',
          jobStatus: 'NotStarted',
        };
        console.log(`[DecisionProjection] Initialized request ${data.requestId}`);
        break;

      case 'QuotationCreated':
        update(data.requestId, { quotationStatus: 'Draft' });
        break;

      case 'QuotationApproved':
        update(data.requestId, { quotationStatus: 'Approved' });
        break;

      case 'JobCreated':
        update(data.requestId, { jobStatus: 'Created' });
        break;

      case 'JobStarted':
        update(data.requestId, { jobStatus: 'InProgress' });
        break;

      case 'JobOnHold':
        update(data.requestId, { jobStatus: 'OnHold' });
        break;

      case 'JobCompleted':
        update(data.requestId, { jobStatus: 'Completed' });
        break;

      case 'ChangeRequestReceivedPendingAssessment':
        console.log(`[DecisionProjection] Change request received for ${data.requestId}`);
        update(data.requestId, { jobStatus: 'Pending CR Assessment' });
        break;

      default:
        console.warn(`[DecisionProjection] Unhandled event type: ${type}`);
        break;
    }

    this.notify();

    function update(requestId, patch) {
      if (!changeRequestDecisionState[requestId]) {
        changeRequestDecisionState[requestId] = {};
      }
      Object.assign(changeRequestDecisionState[requestId], patch);
      console.log(`[DecisionProjection] Updated ${requestId}:`, changeRequestDecisionState[requestId]);
    }
  }
};
