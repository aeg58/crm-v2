import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.token = localStorage.getItem('accessToken');
    
    if (!this.token) {
      console.warn('No access token found, cannot connect to socket');
      return null;
    }

    this.socket = io('/', {
      auth: {
        token: this.token,
      },
      path: '/socket.io',
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  // Event listeners
  onMessageNew(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('message:new', callback);
    }
  }

  onMessageUpdated(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('message:updated', callback);
    }
  }

  onCustomerNew(callback: (customer: any) => void) {
    if (this.socket) {
      this.socket.on('customer:new', callback);
    }
  }

  onLeadNew(callback: (lead: any) => void) {
    if (this.socket) {
      this.socket.on('lead:new', callback);
    }
  }

  onLeadUpdate(callback: (lead: any) => void) {
    if (this.socket) {
      this.socket.on('lead:update', callback);
    }
  }

  onDashboardStats(callback: (stats: any) => void) {
    if (this.socket) {
      this.socket.on('dashboard:stats', callback);
    }
  }

  // Remove event listeners
  offMessageNew(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.off('message:new', callback);
    }
  }

  offMessageUpdated(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.off('message:updated', callback);
    }
  }

  offCustomerNew(callback: (customer: any) => void) {
    if (this.socket) {
      this.socket.off('customer:new', callback);
    }
  }

  offLeadNew(callback: (lead: any) => void) {
    if (this.socket) {
      this.socket.off('lead:new', callback);
    }
  }

  offLeadUpdate(callback: (lead: any) => void) {
    if (this.socket) {
      this.socket.off('lead:update', callback);
    }
  }

  offDashboardStats(callback: (stats: any) => void) {
    if (this.socket) {
      this.socket.off('dashboard:stats', callback);
    }
  }

  // Join/leave rooms
  joinCustomerRoom(customerId: string) {
    if (this.socket) {
      this.socket.emit('join:customer', customerId);
    }
  }

  leaveCustomerRoom(customerId: string) {
    if (this.socket) {
      this.socket.emit('leave:customer', customerId);
    }
  }
}

export const socketManager = new SocketManager();
