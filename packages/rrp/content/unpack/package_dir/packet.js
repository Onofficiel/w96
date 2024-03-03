const { uintToBytes, bytesToUint } = await include("./utils.js");

const HEADER_SIZE = 13;
const MAX_DATA_SIZE = 256 * 1024; // 256 KB

/**
 * Creates a RRP compatible buffer.
 * @param {Number} transferId The unique ID used for the transfer
 * @param {0 | 1} dataType The type of data.
 * @param {Number} numPackets The total number of packets.
 * @param {Number} packetNumber The index of the packet.
 * @data {}
 */
function createBuffer(transferId, dataType, numPackets, packetNumber, data) {
    const bufferSize = HEADER_SIZE + data.length;
    const buffer = new Uint8Array(bufferSize);

    // Write the unique transfer ID (4 bytes)
    buffer.set(uintToBytes(transferId), 0);

    // Write the data type (1 byte)
    buffer.set(new Uint8Array([dataType]), 4);

    // Write the number of packets (4 bytes)
    buffer.set(uintToBytes(numPackets), 5);

    // Write the packet number (4 bytes)
    buffer.set(uintToBytes(packetNumber), 9);

    // Write data
    buffer.set(data, HEADER_SIZE);

    return buffer;
}

function createPackets(data, transferId, type = 0) {
    // Update the RRP ID counter

    const packets = [];

    const dataBuffer = new Uint8Array(data);

    const numPackets = Math.ceil(dataBuffer.length / MAX_DATA_SIZE);

    for (let i = 0; i < numPackets; i++) {
        const sliceStart = numPackets * i;
        const sliceEnd = sliceStart + MAX_DATA_SIZE;

        const slice = dataBuffer.slice(sliceStart, sliceEnd);

        const packet = createBuffer(transferId, type, numPackets, i, slice);
        packets.push(packet);
    }

    return packets;
}

function getHeaderData(packet) {
    const transferId = bytesToUint(packet.slice(0, 4));
    const dataType = packet.at(4);
    const numPackets = bytesToUint(packet.slice(5, 9));
    const packetNumber = bytesToUint(packet.slice(9, 13));

    return {
        transferId,
        dataType,
        numPackets,
        packetNumber,
    };
}

function dataFromPackets(packets) {
    const dataLength = packets
        .map((p) => p.slice(HEADER_SIZE).length)
        .reduce((a, b) => a + b);
    const dataBuffer = new Uint8Array(dataLength);

    for (const packet of packets) {
        const { packetNumber } = getHeaderData(packet);
        const data = packet.slice(HEADER_SIZE);

        dataBuffer.set(data, MAX_DATA_SIZE * packetNumber);
    }

    return dataBuffer;
}

module.exports = {
    HEADER_SIZE,

    createBuffer,
    createPackets,
    dataFromPackets,
    getHeaderData,
};
