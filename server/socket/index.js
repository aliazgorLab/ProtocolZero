const { Server } = require("socket.io");
const admin = require("../config/firebase");
const User = require("../models/User");

let ioInstance = null;

const resolveGeoCell = (point) => {
    if (
        !point ||
        !Array.isArray(point.coordinates) ||
        point.coordinates.length !== 2
    ) {
        return null;
    }

    const [lng, lat] = point.coordinates;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        return null;
    }

    return `geo:${lat.toFixed(1)}:${lng.toFixed(1)}`;
};

const resolveUserGeoCell = (user) => {
    return (
        resolveGeoCell(user.gps) ||
        resolveGeoCell(user.currentAddressGps) ||
        resolveGeoCell(user.homeAddressGps)
    );
};

const resolveNeighborGeoCells = (point) => {
    const baseCell = resolveGeoCell(point);

    if (!baseCell) {
        return [];
    }

    const [prefix, latPart, lngPart] = baseCell.split(":");
    const lat = Number(latPart);
    const lng = Number(lngPart);

    if (prefix !== "geo" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        return [];
    }

    const cells = [];

    for (let latOffset = -1; latOffset <= 1; latOffset += 1) {
        for (let lngOffset = -1; lngOffset <= 1; lngOffset += 1) {
            cells.push(`geo:${(lat + latOffset * 0.1).toFixed(1)}:${(lng + lngOffset * 0.1).toFixed(1)}`);
        }
    }

    return cells;
};

const emitReportToGeoRooms = (eventName, report, payload) => {
    if (!ioInstance) {
        throw new Error("Socket.io has not been initialized yet.");
    }

    const rooms = resolveNeighborGeoCells(report.location);

    rooms.forEach((room) => {
        ioInstance.to(room).emit(eventName, payload);
    });
};

const emitVictimAttached = (payload) => {
    if (!ioInstance) {
        throw new Error("Socket.io has not been initialized yet.");
    }

    ioInstance.to("role:ResponseTeam").to("role:Reporter").emit("victim:attached", payload);
};

const initializeSocket = (httpServer) => {
    if (ioInstance) {
        return ioInstance;
    }

    ioInstance = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
            credentials: true,
        },
    });

    ioInstance.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("Unauthorized: Missing Firebase token."));
            }

            const decodedToken = await admin.auth().verifyIdToken(token);
            const queryConditions = [
                decodedToken.email ? { email: decodedToken.email.toLowerCase() } : null,
                decodedToken.phone_number ? { phone: decodedToken.phone_number } : null,
            ].filter(Boolean);

            const user = await User.findOne({ $or: queryConditions });

            if (!user) {
                return next(new Error("Unauthorized: User profile not synchronized."));
            }

            if (["pending", "rejected"].includes(user.verificationStatus)) {
                return next(new Error("Forbidden: Account is not approved for realtime access."));
            }

            socket.user = user;
            socket.firebaseUid = decodedToken.uid;
            socket.accountType = user.accountType;
            socket.geoCell = resolveUserGeoCell(user);

            return next();
        } catch (error) {
            return next(new Error("Unauthorized: Invalid or expired Firebase ID token."));
        }
    });

    ioInstance.on("connection", (socket) => {
        const userRoom = `user:${socket.user._id.toString()}`;
        const roleRoom = `role:${socket.accountType}`;
        socket.join(userRoom);
        socket.join(roleRoom);

        if (socket.geoCell) {
            socket.join(socket.geoCell);
        }

        socket.emit("socket:ready", {
            success: true,
            userRoom,
            roleRoom,
            geoCell: socket.geoCell,
        });
    });

    return ioInstance;
};

const getIo = () => {
    if (!ioInstance) {
        throw new Error("Socket.io has not been initialized yet.");
    }

    return ioInstance;
};

const emitToRoom = (room, eventName, payload) => {
    if (!ioInstance) {
        throw new Error("Socket.io has not been initialized yet.");
    }

    ioInstance.to(room).emit(eventName, payload);
};

module.exports = {
    initializeSocket,
    getIo,
    emitToRoom,
    emitReportToGeoRooms,
    emitVictimAttached,
    resolveGeoCell,
    resolveNeighborGeoCells,
};