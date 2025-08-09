export function useCustomerSlice() {
  console.warn('useCustomerSlice is deprecated, please use useCustomerProjection or queryCustomersProjectionDB instead');

  return {
    customers: [],
    customerEvents: []
  };
}