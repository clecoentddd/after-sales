const changeRequestDecisionState = {}; // { [requestId]: { quotationStatus, jobStatus, CRstatus } }
const listeners = new Set();

export const ChangeRequestDecisionTreeProjection = {
  getState(requestId) {
    return changeRequestDecisionState[requestId];
  },

  getAll() {
    return Object.entries(changeRequestDecisionState).map(([requestId, state]) => ({
      requestId,
      quotationStatus: state.quotationStatus,
      jobStatus: state.jobStatus,
      CRstatus: state.CRstatus || null,
    }));
  },

  subscribe(callback) {
    listeners.add(callback);
    console.log('[DecisionProjection] New subscriber added, sending initial state:', this.getAll());
    callback(this.getAll());
    return () => {
      listeners.delete(callback);
      console.log('[DecisionProjection] Subscriber removed');
    };
  },

  notify() {
    const allData = this.getAll();
    console.log('[DecisionProjection] Notifying subscribers, current state:', allData);
    listeners.forEach(cb => {
      try {
        cb(allData);
      } catch (err) {
        console.error('[DecisionProjection] Subscriber callback error:', err);
      }
    });
  },

  reset() {
    console.log('[DecisionProjection] Resetting projection, clearing all data');
    for (const key in changeRequestDecisionState) {
      delete changeRequestDecisionState[key];
    }
    this.notify();
  },

  rebuild(events) {
    console.log('[DecisionProjection] Rebuilding projection from events, total events:', events.length);
    this.reset();
    events.forEach(event => this.handleEvent(event));
    console.log('[DecisionProjection] Rebuild complete, final state:', this.getAll());
  },

  handleEvent(event) {
    console.log("[DecisionProjection] Handling event:", event);
    let requestId;

    // Normalize requestId across different event types
    if (event.aggregateType === 'Request' || event.aggregateType === 'ChangeRequest') {
      requestId = event.aggregateId;
    } else {
      requestId = event.requestId || (event.data && event.data.requestId);
    }

    if (!requestId) {
      console.warn(`[DecisionProjection] Event missing requestId: ${event.type}`, event);
      return; // skip event without requestId
    }

    if (!changeRequestDecisionState[requestId]) {
      changeRequestDecisionState[requestId] = {
        quotationStatus: null,
        jobStatus: null,
        CRstatus: null,
      };
      console.log(`[DecisionProjection] Created new state for requestId: ${requestId}`);
    }

    switch (event.type) {
      case 'RequestCreated':
        Object.assign(changeRequestDecisionState[requestId], {
          quotationStatus: 'NotStarted',
          jobStatus: 'NotStarted',
        });
        console.log(`[DecisionProjection] Updated RequestCreated for ${requestId}`);
        break;

      case 'QuotationCreated':
        changeRequestDecisionState[requestId].quotationStatus = 'Draft';
        console.log(`[DecisionProjection] Updated QuotationCreated for ${requestId}`);
        break;

      case 'QuotationApproved':
        changeRequestDecisionState[requestId].quotationStatus = 'Approved';
        console.log(`[DecisionProjection] Updated QuotationApproved for ${requestId}`);
        break;

      case 'JobCreated':
        changeRequestDecisionState[requestId].jobStatus = 'Created';
        console.log(`[DecisionProjection] Updated JobCreated for ${requestId}`);
        break;

      case 'JobStarted':
        changeRequestDecisionState[requestId].jobStatus = 'InProgress';
        console.log(`[DecisionProjection] Updated JobStarted for ${requestId}`);
        break;
        
      case 'JobCompleted':
        changeRequestDecisionState[requestId].jobStatus = 'Completed';
        console.log(`[DecisionProjection] Updated JobCompleted for ${requestId}`);
        break;

      case 'ChangeRequestRaised':
        changeRequestDecisionState[requestId].CRstatus = 'Raised';
        console.log(`[DecisionProjection] Updated ChangeRequestRaised for ${requestId}`);
        break;
      case 'ChangeRequestReceivedPendingAssessment':
        changeRequestDecisionState[requestId].CRStatus = 'CR Assigned';
        console.log(`[DecisionProjection] Updated ChangeRequestReceivedPendingAssessment for ${requestId}`);
        break;

      default:
        console.log(`[DecisionProjection] Event type not handled: ${event.type}`);
        break;
    }

    if (event.data && event.data.CRstatus) {
      changeRequestDecisionState[requestId].CRstatus = event.data.CRstatus;
      console.log(`[DecisionProjection] Updated CRstatus for ${requestId}:`, event.data.CRstatus);
    }

    this.notify();
  },
};
