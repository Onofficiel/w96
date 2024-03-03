const { ppp2 } = w96.net;

const { decodeAddress } = await include("./utils.js");
const { createPackets, getHeaderData, dataFromPackets } = await include("./packet.js");

const RESPONSE_PORT = 610;
const RESPONSE_TIMEOUT = 10e3;

function send(address, port, data) {
    return new Promise(async (resolve, reject) => {
        const client = await ppp2.getClient();

        if (w96.wmem.rrpId === undefined) {
            w96.wmem.rrpId = 0;
        } else {
            w96.wmem.rrpId += 1;
        }

        const id = w96.wmem.rrpId;

        // Decode the address if formatted like:
        // "ffff:ffff:ffff:ffff"
        if (typeof address === "string") {
            address = decodeAddress(address);
        }

        // Buffer:
        const packets = createPackets(data, id, 0);

        // Create a server to wait for the response
        let timeout = null;
        const responsePackets = [];
        const server = client.listen(RESPONSE_PORT, (source, packet) => {
            const { transferId, numPackets, dataType } = getHeaderData(packet);

            // If the packet is not valid
            if (address !== source || transferId !== id || dataType !== 1) {
                return;
            }

            // Add the packet to the response packets array
            responsePackets.push(packet);

            // If the response is complete:
            if (packets.length >= numPackets) {
                if (timeout) {
                    clearTimeout(timeout);
                }

                // Close the server and resolve the promise
                const data = dataFromPackets(responsePackets);
                server.close();
                resolve(data);

                return;
            }

            // If the response is not complete, wait for the next packet
            // And reset the timeout timer
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(
                reject.bind(this, new Error("Response Timeout")),
                RESPONSE_TIMEOUT
            )
        });

        // Send the packets
        for (const packet of packets) {
            client.send(address, port, packet);
        }

        // Set a timeout to reject the promise if no response is received in time
        timeout = setTimeout(
            reject.bind(this, new Error("Response Timeout")),
            RESPONSE_TIMEOUT
        );
    });
}

async function listen(port, handler) {
    const client = await ppp2.getClient();

    // Create a server to listen for packets
    let packetInfoMap = new Map(); // Map to store packet info for each source and transferId
    const server = client.listen(port, async (source, packet) => {
        const { transferId, numPackets } = getHeaderData(packet);

        // Get the packet info for the current source and transferId
        let packetInfoKey = `${source}_${transferId}`;
        let packetInfo = packetInfoMap.get(packetInfoKey);

        // If the packet info doesn't exist, create a new one
        if (!packetInfo) {
            packetInfo = {
                transferId,
                numPackets,
                source,
                packets: [],
            };
            packetInfoMap.set(packetInfoKey, packetInfo);
        }

        // If the packet is not valid
        if (source !== packetInfo.source) {
            return; // Ignore the packet for different source
        }

        packetInfo.packets.push(packet);

        if (packetInfo.packets.length >= packetInfo.numPackets) {
            const data = dataFromPackets(packetInfo.packets);
            const response = await handler(source, data);

            if (response) {
                const responseBuffer = new Uint8Array(response);
                const responsePackets = createPackets(
                    responseBuffer,
                    packetInfo.transferId,
                    1
                );

                for (const responsePacket of responsePackets) {
                    client.send(
                        packetInfo.source,
                        RESPONSE_PORT,
                        responsePacket
                    );
                }
            }

            // Clear the packet info after processing
            packetInfoMap.delete(packetInfoKey);
        }
    });

    return server;
}

module.exports = {
    send,
    listen,
};
