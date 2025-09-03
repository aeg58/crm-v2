import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyAccessToken } from './auth';
import { config } from '@crm/config';

let io: SocketIOServer;

export function initializeSocket(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: config.socketPath,
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const payload = verifyAccessToken(token);
      
      // Attach user info to socket
      (socket as any).user = payload;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    const user = (socket as any).user;
    console.log(`User ${user.email} connected with socket ${socket.id}`);

    // Join user to their personal room
    socket.join(`user:${user.userId}`);

    // Join admin users to admin room
    if (user.role === 'ADMIN') {
      socket.join('admin');
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${user.email} disconnected`);
    });

    // Handle custom events
    socket.on('join:customer', (customerId: string) => {
      socket.join(`customer:${customerId}`);
    });

    socket.on('leave:customer', (customerId: string) => {
      socket.leave(`customer:${customerId}`);
    });
  });

  return io;
}

export { io };
