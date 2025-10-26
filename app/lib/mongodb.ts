import mongoose from 'mongoose';

let isConnected = false;  // Track the connection state

export async function connect() {
    try {
        // Avoid reconnecting if already connected
        if (isConnected) {
            console.log('Already connected to MongoDB');
            return;
        }

        await mongoose.connect(process.env.DATABASE_URL!);

        const connection = mongoose.connection;
        connection.setMaxListeners(30);

        connection.on('connected', () => {
            console.log('MongoDB connected successfully');
            isConnected = true;  // Mark as connected
        });

        connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
            isConnected = false;  // Mark as disconnected
            // Retry the connection after 5 seconds
            setTimeout(connect, 5000);
        });

    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        // Retry the connection after 5 seconds
        setTimeout(connect, 5000);
    }
}
