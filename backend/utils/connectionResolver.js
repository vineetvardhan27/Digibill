/**
 * Helper to determine what happens when a connection request is made 
 * but a connection record already exists between the shop and supplier.
 *
 * @param {Object} existingConnection - The Mongoose document of the existing connection
 * @param {String} initiator - 'shop' or 'supplier'
 * @returns {Object} { action: 'error' | 'auto-accept' | 'reset' | 'create', message?: string }
 */
export const resolveConnectionRequest = (existingConnection, initiator) => {
  if (!existingConnection) {
    return { action: 'create' };
  }

  const { status, initiatedBy } = existingConnection;

  if (status === 'connected') {
    return { action: 'error', message: 'Already connected' };
  }

  if (status === 'pending') {
    if (initiatedBy === initiator) {
      return { action: 'error', message: 'Request already sent' };
    } else {
      // Mutual interest! Auto-accept
      return { action: 'auto-accept' };
    }
  }

  if (status === 'rejected' || status === 'disconnected') {
    return { action: 'reset' };
  }

  return { action: 'error', message: 'Unknown connection status' };
};
