function decodeAddress(address) {
    return BigInt("0x" + address.replace(/:/g, ""))
}

// Helper function to convert integer to byte array (4 bytes)
function uintToBytes(value) {
    const byteArray = new ArrayBuffer(4);
    const intView = new DataView(byteArray);
    intView.setUint32(0, value);
    return new Uint8Array(byteArray);
}

function bytesToUint(byteArray) {
    const view = new DataView(byteArray.buffer);
    return view.getUint32(0); // Get unsigned 32-bit integer from the beginning of the buffer
}

module.exports = {
    decodeAddress,
    uintToBytes,
    bytesToUint,
}